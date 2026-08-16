import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Category } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ createdAt: -1 });
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }
    const category = await Category.create({ name: body.name.trim(), description: body.description || '' });
    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ message: 'Category already exists' }, { status: 400 });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
