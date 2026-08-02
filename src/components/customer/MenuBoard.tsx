'use client';

import { useState } from 'react';
import { Menu } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MenuDetailModal from './MenuDetailModal';

interface MenuBoardProps {
  menus: Menu[];
  storeStatus?: 'OPEN' | 'PAUSE' | 'CLOSE';
}

export default function MenuBoard({ menus, storeStatus }: MenuBoardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const categories = ['ALL', ...Array.from(new Set(menus.map(m => m.category)))];

  const filteredMenus = selectedCategory === 'ALL'
    ? menus
    : menus.filter(m => m.category === selectedCategory);

  if (storeStatus === 'CLOSE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h2 className="text-3xl font-bold text-destructive">영업 종료</h2>
        <p className="text-muted-foreground">현재는 주문할 수 없습니다. 영업 시간에 다시 방문해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {storeStatus === 'PAUSE' && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-center font-medium">
          현재 주문이 폭주하여 일시적으로 접수를 중단했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors font-medium text-sm ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredMenus.map(menu => {
          const isUnavailable = menu.is_sold_out || menu.stock_quantity <= 0 || storeStatus === 'PAUSE';
          return (
            <Card 
              key={menu.id} 
              onClick={() => !isUnavailable && setSelectedMenu(menu)}
              className={`group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95 ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                {menu.image_url ? (
                  menu.image_url.startsWith('http') || menu.image_url.startsWith('/') ? (
                    <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl sm:text-7xl md:text-8xl bg-white transition-transform duration-500 group-hover:scale-110">
                      {menu.image_url}
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
                {(menu.is_sold_out || menu.stock_quantity <= 0) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">품절 (Sold Out)</span>
                  </div>
                )}
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-1 sm:mb-2">
                  <h3 className="font-bold text-sm sm:text-base line-clamp-1">{menu.name}</h3>
                </div>
                <p className="text-primary font-semibold text-sm sm:text-base">{menu.price.toLocaleString()}원</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {filteredMenus.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          해당 카테고리에 메뉴가 없습니다.
        </div>
      )}
      <MenuDetailModal 
        menu={selectedMenu}
        isOpen={!!selectedMenu}
        onClose={() => setSelectedMenu(null)}
      />
    </div>
  );
}
