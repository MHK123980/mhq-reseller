import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Product } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get('featured');
    const filter: any = {};
    if (featured === 'true') filter.isFeatured = true;
    const products = await Product.find(filter).populate('category', 'name').sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    if (!body.name || !body.price || !body.description || !body.category) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const product = await Product.create(body);
    const populated = await product.populate('category', 'name');
    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
