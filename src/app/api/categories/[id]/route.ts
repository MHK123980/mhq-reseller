import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Category } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const category = await Category.findByIdAndUpdate(params.id, body, { new: true });
    if (!category) return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    return NextResponse.json(category);
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const category = await Category.findByIdAndDelete(params.id);
    if (!category) return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    return NextResponse.json({ message: 'Category deleted' });
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
