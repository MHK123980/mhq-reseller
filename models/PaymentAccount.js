const mongoose = require('mongoose');

const paymentAccountSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  bankCode: { type: String, required: true, unique: true }, // unique code e.g. 'easypaisa', 'jazzcash', 'meezan', to prevent duplicate additions
  accountTitle: { type: String, required: true },
  accountNumber: { type: String, required: true }, // Phone or IBAN
  instructions: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.PaymentAccount || mongoose.model('PaymentAccount', paymentAccountSchema);
