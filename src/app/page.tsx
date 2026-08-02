import { createClient } from '@/lib/supabase/server';
import MenuBoard from '@/components/customer/MenuBoard';

export const revalidate = 0; // Disable cache for MVP to see realtime DB updates easily, or use revalidate = 10

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch store settings (assume single row for MVP)
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('status')
    .limit(1)
    .single();

  // Fetch menus
  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-foreground">주문하기</h1>
      <MenuBoard 
        menus={menus || []} 
        storeStatus={storeSettings?.status as any} 
      />
    </div>
  );
}
