import { NextResponse } from 'next/server';
import { connectDB, Order } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    return NextResponse.json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: revenueAgg[0]?.total || 0
    });
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
