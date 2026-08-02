import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminMenuClient from '@/components/admin/AdminMenuClient';

export const revalidate = 0;

export default async function AdminMenusPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdminMenuClient initialMenus={menus || []} />
  );
}
