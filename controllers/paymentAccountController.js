const PaymentAccount = require('../models/PaymentAccount');

// Predefined banks list with SVG icons / logos
const PRESET_BANKS = [
  { code: 'easypaisa', name: 'EasyPaisa', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Easypaisa_logo.png' },
  { code: 'jazzcash', name: 'JazzCash', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/JazzCash_logo.svg/1200px-JazzCash_logo.svg.png' },
  { code: 'meezan', name: 'Meezan Bank', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Meezan_Bank_Logo.svg/1200px-Meezan_Bank_Logo.svg.png' },
  { code: 'hbl', name: 'Habib Bank Limited (HBL)', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Habib_Bank_Limited_logo.svg/1200px-Habib_Bank_Limited_logo.svg.png' },
  { code: 'ubl', name: 'United Bank Limited (UBL)', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/United_Bank_Limited_logo.svg/1200px-United_Bank_Limited_logo.svg.png' },
  { code: 'alfalah', name: 'Bank Alfalah', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Bank_Alfalah_Logo.svg/1200px-Bank_Alfalah_Logo.svg.png' },
  { code: 'faysal', name: 'Faysal Bank', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Faysal_Bank_Logo.svg/1200px-Faysal_Bank_Logo.svg.png' },
  { code: 'mcb', name: 'MCB Bank', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/MCB_Bank_logo.svg/1200px-MCB_Bank_logo.svg.png' },
  { code: 'allied', name: 'Allied Bank Limited (ABL)', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Allied_Bank_Limited_Logo.svg/1200px-Allied_Bank_Limited_Logo.svg.png' },
  { code: 'nayapay', name: 'NayaPay', icon: 'https://nayapay.com/assets/images/logo/nayapay-logo.svg' },
  { code: 'sadapay', name: 'SadaPay', icon: 'https://sadapay.pk/wp-content/uploads/2021/04/SadaPay-Logo.svg' }
];

const getAll = async (req, res) => {
  try {
    const isCustomer = req.query.public === 'true';
    const filter = isCustomer ? { isActive: true } : {};
    const accounts = await PaymentAccount.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, accounts, presetBanks: PRESET_BANKS });
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

    const existing = await PaymentAccount.findOne({ bankCode: bankCode.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Account for ${existing.bankName} already exists! Only one account per bank is allowed.` });
    }

    const preset = PRESET_BANKS.find(b => b.code.toLowerCase() === bankCode.toLowerCase().trim());
    const finalName = bankName || (preset ? preset.name : bankCode);
    const finalLogo = logoUrl || (preset ? preset.icon : '');

    const account = await PaymentAccount.create({
      bankCode: bankCode.toLowerCase().trim(),
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
    const { accountTitle, accountNumber, instructions, isActive, logoUrl } = req.body;
    const account = await PaymentAccount.findByIdAndUpdate(
      req.params.id,
      {
        accountTitle,
        accountNumber,
        instructions,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        logoUrl
      },
      { new: true }
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
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

module.exports = { getAll, create, update, remove, PRESET_BANKS };
