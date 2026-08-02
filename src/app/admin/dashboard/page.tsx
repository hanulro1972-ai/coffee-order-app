import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch store settings
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1)
    .single();

  // Fetch initial orders
  const { data: initialOrders } = await supabase
    .from('orders')
    .select('*, order_items(*, menus(*))')
    .order('created_at', { ascending: false })
    .limit(50); // Get last 50 orders

  return (
    <AdminDashboardClient 
      initialStoreSettings={storeSettings} 
      initialOrders={initialOrders || []} 
    />
  );
}
