import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (cartItemId) => set((state) => ({ 
        items: state.items.filter(i => i.cartItemId !== cartItemId) 
      })),
      updateQuantity: (cartItemId, quantity) => set((state) => ({
        items: state.items.map(i => {
          if (i.cartItemId === cartItemId) {
            const unitPrice = i.totalPrice / i.quantity;
            return { ...i, quantity, totalPrice: unitPrice * quantity };
          }
          return i;
        })
      })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
