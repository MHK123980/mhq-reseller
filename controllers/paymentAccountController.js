const PaymentAccount = require('../models/PaymentAccount');

// Predefined banks list with 100% self-contained, high-definition vector SVG logos (No external links, no CORS, no 403)
const PRESET_BANKS = [
  {
    code: 'easypaisa',
    name: 'EasyPaisa',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%2300A651"/><path d="M50 20C33.4 20 20 33.4 20 50s13.4 30 30 30 30-13.4 30-30h-12c0 9.9-8.1 18-18 18s-18-8.1-18-18 8.1-18 18-18c5 0 9.5 2 12.7 5.3l8.5-8.5C65.8 23.9 58.3 20 50 20z" fill="%23ffffff"/><circle cx="50" cy="50" r="9" fill="%23ffffff"/></svg>'
  },
  {
    code: 'jazzcash',
    name: 'JazzCash',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%2318181b"/><circle cx="40" cy="50" r="24" fill="%23e30613"/><circle cx="60" cy="50" r="24" fill="%23ffb600" opacity="0.9"/><circle cx="50" cy="50" r="14" fill="%23ffffff"/></svg>'
  },
  {
    code: 'meezan',
    name: 'Meezan Bank',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%236a1532"/><path d="M50 18C38 18 28 28 28 40v38h44V40c0-12-10-22-22-22zm0 10c7 0 13 6 13 13v25H37V41c0-7 6-13 13-13z" fill="%23d4af37"/><circle cx="50" cy="36" r="4" fill="%23ffffff"/></svg>'
  },
  {
    code: 'hbl',
    name: 'Habib Bank Limited (HBL)',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23007c5a"/><path d="M50 20l28 22-11 36H33L22 42z" fill="%23ffffff"/><polygon points="50,32 68,46 61,68 39,68 32,46" fill="%23007c5a"/><circle cx="50" cy="52" r="7" fill="%23ffffff"/></svg>'
  },
  {
    code: 'ubl',
    name: 'United Bank Limited (UBL)',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%2300539b"/><circle cx="50" cy="50" r="28" fill="none" stroke="%2300a3e0" stroke-width="10"/><path d="M50 22a28 28 0 0 1 28 28h-10a18 18 0 0 0-18-18z" fill="%23ffffff"/><circle cx="50" cy="50" r="10" fill="%23ffffff"/></svg>'
  },
  {
    code: 'alfalah',
    name: 'Bank Alfalah',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23d31411"/><path d="M50 18c-17 0-30 13-30 30s13 30 30 30 30-13 30-30h-10c0 11-9 20-20 20s-20-9-20-20 9-20 20-20c6 0 11 3 14 7l8-6c-5-7-13-11-22-11z" fill="%23ffffff"/><circle cx="50" cy="48" r="8" fill="%23ffffff"/></svg>'
  },
  {
    code: 'faysal',
    name: 'Faysal Bank',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%230c2340"/><path d="M52 24c-15 0-27 12-27 27s12 27 27 27c8 0 15-3 20-9-10 2-21-4-24-15s3-22 13-26c-3-2-6-4-9-4z" fill="%23d4af37"/><circle cx="68" cy="38" r="6" fill="%23ffffff"/></svg>'
  },
  {
    code: 'mcb',
    name: 'MCB Bank',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23f37021"/><path d="M50 20L26 32v24c0 16 10 30 24 34 14-4 24-18 24-34V32z" fill="%23ffffff"/><path d="M50 30l16 8v16c0 10-6 19-16 22-10-3-16-12-16-22V38z" fill="%23f37021"/><circle cx="50" cy="50" r="7" fill="%23ffffff"/></svg>'
  },
  {
    code: 'allied',
    name: 'Allied Bank Limited (ABL)',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23003882"/><path d="M50 18L24 78h16l10-24 10 24h16z" fill="%23ffffff"/><polygon points="50,42 42,62 58,62" fill="%23ff6600"/></svg>'
  },
  {
    code: 'nayapay',
    name: 'NayaPay',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23ff6b00"/><path d="M30 24v52h14V46l18 30h8V24H56v30L38 24z" fill="%23ffffff"/></svg>'
  },
  {
    code: 'sadapay',
    name: 'SadaPay',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%231e293b"/><circle cx="42" cy="50" r="20" fill="%23ff6b6b"/><circle cx="58" cy="50" r="20" fill="%2300d2d3" opacity="0.85"/><circle cx="50" cy="50" r="11" fill="%23ffffff"/></svg>'
  },
  {
    code: 'other',
    name: 'Other Bank / Wallet',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%2327272a"/><path d="M20 78h60v6H20zm6-26h8v22h-8zm16 0h8v22h-8zm16 0h8v22h-8zm16 0h8v22h-8zM50 16L20 34v6h60v-6z" fill="%23f59e0b"/></svg>'
  }
];

// Helper to get fallback logo for any bank code
function getBankLogo(bankCode) {
  const code = (bankCode || '').toLowerCase().trim();
  const match = PRESET_BANKS.find(b => b.code.toLowerCase() === code);
  return match ? match.logoUrl : PRESET_BANKS[PRESET_BANKS.length - 1].logoUrl;
}

const getAll = async (req, res) => {
  try {
    const isCustomer = req.query.public === 'true';
    const filter = isCustomer ? { isActive: { $ne: false } } : {};
    const accounts = await PaymentAccount.find(filter).sort({ createdAt: -1 }).lean();

    // Guarantee reliable vector logo for all accounts
    const enriched = accounts.map(a => ({
      ...a,
      logoUrl: getBankLogo(a.bankCode)
    }));

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
    const { bankCode, bankName, accountTitle, accountNumber, instructions } = req.body;
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
    const finalLogo = getBankLogo(cleanCode);

    const account = await PaymentAccount.create({
      bankCode: cleanCode,
      bankName: finalName,
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      instructions: instructions ? instructions.trim() : '',
      logoUrl: finalLogo
    });

    const accountObj = { ...account.toObject(), logoUrl: finalLogo };

    // Pusher real-time broadcast to checkout and admin
    const pusher = req.app.get('pusher');
    if (pusher) {
      try {
        pusher.trigger('mhq-reseller', 'payment-account:new', accountObj).catch(e => console.warn(e.message));
      } catch (e) {}
    }

    res.status(201).json({ success: true, account: accountObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { bankName, accountTitle, accountNumber, instructions, isActive } = req.body;
    const account = await PaymentAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    if (bankName) account.bankName = bankName.trim();
    if (accountTitle) account.accountTitle = accountTitle.trim();
    if (accountNumber) account.accountNumber = accountNumber.trim();
    if (instructions !== undefined) account.instructions = instructions.trim();
    account.logoUrl = getBankLogo(account.bankCode);
    if (isActive !== undefined) account.isActive = Boolean(isActive);

    await account.save();

    const accountObj = { ...account.toObject(), logoUrl: account.logoUrl };

    // Pusher real-time broadcast
    const pusher = req.app.get('pusher');
    if (pusher) {
      try {
        pusher.trigger('mhq-reseller', 'payment-account:updated', accountObj).catch(e => console.warn(e.message));
      } catch (e) {}
    }

    res.json({ success: true, account: accountObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    // Pusher real-time broadcast
    const pusher = req.app.get('pusher');
    if (pusher) {
      try {
        pusher.trigger('mhq-reseller', 'payment-account:deleted', { id: req.params.id }).catch(e => console.warn(e.message));
      } catch (e) {}
    }

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
