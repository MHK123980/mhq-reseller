const PaymentAccount = require('../models/PaymentAccount');

// Predefined banks list with built-in, 100% reliable SVG logos
const PRESET_BANKS = [
  {
    code: 'easypaisa',
    name: 'EasyPaisa',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Easypaisa_logo.png'
  },
  {
    code: 'jazzcash',
    name: 'JazzCash',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/JazzCash_logo.svg/1200px-JazzCash_logo.svg.png'
  },
  {
    code: 'meezan',
    name: 'Meezan Bank',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Meezan_Bank_Logo.svg/1200px-Meezan_Bank_Logo.svg.png'
  },
  {
    code: 'hbl',
    name: 'Habib Bank Limited (HBL)',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Habib_Bank_Limited_logo.svg/1200px-Habib_Bank_Limited_logo.svg.png'
  },
  {
    code: 'ubl',
    name: 'United Bank Limited (UBL)',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/United_Bank_Limited_logo.svg/1200px-United_Bank_Limited_logo.svg.png'
  },
  {
    code: 'alfalah',
    name: 'Bank Alfalah',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Bank_Alfalah_Logo.svg/1200px-Bank_Alfalah_Logo.svg.png'
  },
  {
    code: 'faysal',
    name: 'Faysal Bank',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Faysal_Bank_Logo.svg/1200px-Faysal_Bank_Logo.svg.png'
  },
  {
    code: 'mcb',
    name: 'MCB Bank',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/MCB_Bank_logo.svg/1200px-MCB_Bank_logo.svg.png'
  },
  {
    code: 'allied',
    name: 'Allied Bank Limited (ABL)',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Allied_Bank_Limited_Logo.svg/1200px-Allied_Bank_Limited_Logo.svg.png'
  },
  {
    code: 'nayapay',
    name: 'NayaPay',
    logoUrl: 'https://nayapay.com/assets/images/logo/nayapay-logo.svg'
  },
  {
    code: 'sadapay',
    name: 'SadaPay',
    logoUrl: 'https://sadapay.pk/wp-content/uploads/2021/04/SadaPay-Logo.svg'
  },
  {
    code: 'other',
    name: 'Other Bank / Wallet',
    logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d97706'%3E%3Cpath d='M2 20h20v2H2v-2zm2-8h2v7H4v-7zm5 0h2v7H9v-7zm5 0h2v7h-2v-7zm5 0h2v7h-2v-7zM12 2L2 7v3h20V7L12 2z'/%3E%3C/svg%3E"
  }
];

// Helper to get fallback logo for any bank code
function getBankLogo(bankCode, customLogo) {
  if (customLogo && customLogo.trim()) return customLogo.trim();
  const match = PRESET_BANKS.find(b => b.code.toLowerCase() === (bankCode || '').toLowerCase().trim());
  return match ? match.logoUrl : PRESET_BANKS[PRESET_BANKS.length - 1].logoUrl;
}

const getAll = async (req, res) => {
  try {
    const isCustomer = req.query.public === 'true';
    const filter = isCustomer ? { isActive: { $ne: false } } : {};
    const accounts = await PaymentAccount.find(filter).sort({ createdAt: -1 });

    // Always guarantee logoUrl is present
    const enriched = accounts.map(a => {
      const obj = a.toObject();
      if (!obj.logoUrl || obj.logoUrl.trim() === '') {
        obj.logoUrl = getBankLogo(obj.bankCode, obj.logoUrl);
      }
      return obj;
    });

    res.json({
      success: true,
      accounts: enriched,
      presetBanks: PRESET_BANKS
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { bankCode, bankName, accountTitle, accountNumber, instructions, logoUrl } = req.body;
    if (!bankCode || !accountTitle || !accountNumber) {
      return res.status(400).json({ success: false, message: 'Bank, Account Title, and Number are required' });
    }

    const cleanCode = bankCode.toLowerCase().trim();
    const existing = await PaymentAccount.findOne({ bankCode: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Account for ${existing.bankName} already exists! Each bank can only be added once.` });
    }

    const preset = PRESET_BANKS.find(b => b.code.toLowerCase() === cleanCode);
    const finalName = bankName || (preset ? preset.name : bankCode);
    const finalLogo = getBankLogo(cleanCode, logoUrl);

    const account = await PaymentAccount.create({
      bankCode: cleanCode,
      bankName: finalName,
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      instructions: instructions ? instructions.trim() : '',
      logoUrl: finalLogo
    });

    res.status(201).json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { bankName, accountTitle, accountNumber, instructions, logoUrl, isActive } = req.body;
    const account = await PaymentAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    if (bankName) account.bankName = bankName.trim();
    if (accountTitle) account.accountTitle = accountTitle.trim();
    if (accountNumber) account.accountNumber = accountNumber.trim();
    if (instructions !== undefined) account.instructions = instructions.trim();
    if (logoUrl !== undefined) account.logoUrl = getBankLogo(account.bankCode, logoUrl);
    if (isActive !== undefined) account.isActive = Boolean(isActive);

    await account.save();
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  PRESET_BANKS,
  getBankLogo,
  getAll,
  create,
  update,
  remove
};
