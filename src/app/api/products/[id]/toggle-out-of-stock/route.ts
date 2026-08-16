import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Product } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const product = await Product.findById(params.id);
    if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    product.isOutOfStock = !product.isOutOfStock;
    await product.save();
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
