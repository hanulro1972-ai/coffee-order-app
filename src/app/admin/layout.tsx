import Link from 'next/link';
import { Store, LayoutDashboard, Coffee } from 'lucide-react';
import LogoutButton from '@/components/admin/LogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r flex flex-col">
        <div className="h-14 border-b flex items-center px-4 font-bold gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span>관리자 센터</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium"
          >
            <LayoutDashboard className="h-4 w-4" />
            대시보드
          </Link>
          <Link 
            href="/admin/menus" 
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium"
          >
            <Coffee className="h-4 w-4" />
            메뉴 관리
          </Link>
        </nav>
        <div className="p-4 border-t">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
