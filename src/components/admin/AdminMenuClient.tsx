'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminMenuClient({ initialMenus }: { initialMenus: Menu[] }) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const supabase = createClient();

  const toggleSoldOut = async (menu: Menu) => {
    const newStatus = !menu.is_sold_out;
    const { error } = await supabase
      .from('menus')
      .update({ is_sold_out: newStatus })
      .eq('id', menu.id);

    if (!error) {
      setMenus(menus.map(m => m.id === menu.id ? { ...m, is_sold_out: newStatus } : m));
      toast.success(`${menu.name} 품절 상태가 변경되었습니다.`);
    } else {
      toast.error('상태 변경 실패');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">메뉴 관리</h1>
        {/* MVP level: Add menu form omitted for brevity, focusing on manual sold out toggle */}
        <Button onClick={() => toast.info('메뉴 추가 기능은 준비중입니다.')}>메뉴 추가</Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이미지</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>메뉴명</TableHead>
              <TableHead className="text-right">가격</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">재고 수량</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <TableRow key={menu.id}>
                <TableCell>
                  {menu.image_url ? (
                    menu.image_url.startsWith('http') || menu.image_url.startsWith('/') ? (
                      <img src={menu.image_url} alt={menu.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center text-xl bg-muted rounded">
                        {menu.image_url}
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded" />
                  )}
                </TableCell>
                <TableCell>{menu.category}</TableCell>
                <TableCell className="font-medium">{menu.name}</TableCell>
                <TableCell className="text-right">{menu.price.toLocaleString()}원</TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    menu.is_sold_out ? 'bg-destructive/20 text-destructive' : 'bg-green-100 text-green-800'
                  }`}>
                    {menu.is_sold_out ? '품절' : '판매중'}
                  </span>
                </TableCell>
                <TableCell className="text-center">{menu.stock_quantity}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleSoldOut(menu)}
                  >
                    {menu.is_sold_out ? '판매 재개' : '품절 처리'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {menus.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  등록된 메뉴가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
