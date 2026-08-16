import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { status } = await req.json();
    const order = await Order.findByIdAndUpdate(params.id, { status }, { new: true })
      .populate('products.product', 'name images price');
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const order = await Order.findByIdAndDelete(params.id);
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    return NextResponse.json({ message: 'Order deleted' });
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
