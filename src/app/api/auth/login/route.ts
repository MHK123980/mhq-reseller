import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MONGO_URI = process.env.MONGO_URI!;
const JWT_SECRET = process.env.JWT_SECRET || 'mhq_secret_key_123980_broker';
const OWNER_EMAIL = 'mhqreseller@owner.com';
const OWNER_PASSWORD = 'mhq123reseller#980';

// Mongoose connection cache
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
}

// User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Owner', 'Admin', 'Manager'], default: 'Manager' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail === OWNER_EMAIL && password === OWNER_PASSWORD) {
      let owner = await User.findOne({ email: OWNER_EMAIL });
      const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);
      if (!owner) {
        owner = await User.create({ email: OWNER_EMAIL, password: hashedPassword, role: 'Owner', name: 'MHQ Owner' });
      } else {
        owner.password = hashedPassword;
        await owner.save();
      }
      const token = jwt.sign({ id: owner._id, role: owner.role, name: owner.name }, JWT_SECRET, { expiresIn: '7d' });
      return NextResponse.json({ token, user: { id: owner._id, email: owner.email, name: owner.name, role: owner.role } });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    return NextResponse.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
