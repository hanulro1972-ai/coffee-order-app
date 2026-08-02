import { createClient } from '@/lib/supabase/server';
import OrderStatusTracker from '@/components/customer/OrderStatusTracker';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*, menus(*))')
    .eq('id', id)
    .single();

  if (error || !order) {
    return notFound();
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center mb-8">주문 상태 확인</h1>
      <OrderStatusTracker initialOrder={order as any} />
    </div>
  );
}
