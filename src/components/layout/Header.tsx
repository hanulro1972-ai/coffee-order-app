'use client';

import Link from 'next/link';
import { Coffee, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  const items = useCartStore(state => state.items);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4 max-w-2xl">
        <Link href="/" className="flex items-center space-x-2">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">CoffeeOrder</span>
        </Link>
        <Link href="/cart" className="relative p-2 flex items-center justify-center transition-colors hover:text-primary">
          <ShoppingCart className="h-6 w-6" />
          {totalQuantity > 0 && (
            <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {totalQuantity}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
