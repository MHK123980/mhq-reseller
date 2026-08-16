import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order, Product } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).populate('products.product', 'name images price').sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { customerDetails, products } = await req.json();
    if (!customerDetails || !products || products.length === 0) {
      return NextResponse.json({ message: 'Customer details and products are required' }, { status: 400 });
    }

    let totalAmount = 0;
    const orderProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return NextResponse.json({ message: `Product not found: ${item.productId}` }, { status: 404 });
      const price = product.hasDiscount && product.discountPercent > 0
        ? product.price - (product.price * (product.discountPercent / 100))
        : product.price;
      orderProducts.push({ product: product._id, quantity: item.quantity || 1, priceAtPurchase: price });
      totalAmount += price * (item.quantity || 1);
    }

    const order = await Order.create({ customerDetails, products: orderProducts, totalAmount, status: 'Pending' });
    const populated = await order.populate('products.product', 'name images price');
    return NextResponse.json({ message: 'Order placed successfully', order: populated }, { status: 201 });
  } catch (err: any) {
    console.error('Order error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
