'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    
    // Mock Payment Process (setTimeout)
    toast.info('결제를 진행중입니다...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const supabase = createClient();
      const idempotencyKey = uuidv4();
      const orderTotalPrice = getTotalPrice();

      // 1. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          idempotency_key: idempotencyKey,
          total_price: orderTotalPrice,
          status: '접수대기',
          guest_name: '손님_' + Math.floor(Math.random() * 1000)
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // 2. Insert Order Items
      const orderItemsToInsert = items.map(item => ({
        order_id: orderData.id,
        menu_id: item.menu.id,
        quantity: item.quantity,
        unit_price: item.totalPrice / item.quantity, // single item + options price
        selected_option_ids: item.options.map(opt => opt.id)
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('결제 및 주문이 완료되었습니다!');
      clearCart();
      
      // Navigate to order status page
      router.push(`/order/${orderData.id}`);

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('주문 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-secondary/30 rounded-full mb-2">
            <ShoppingCartIcon className="h-20 w-20 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">장바구니가 비어있습니다</h2>
            <p className="text-muted-foreground">맛있는 커피와 디저트를 골라보세요!</p>
          </div>
          <Link href="/" className={buttonVariants({ size: "lg", className: "mt-4 w-full max-w-xs rounded-full shadow-md hover:shadow-lg transition-all" })}>
            메뉴 보러가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6 pb-24">
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">장바구니</h1>
      </div>

      <div className="space-y-4">
        {items.map(item => (
          <Card key={item.cartItemId}>
            <CardContent className="p-4 flex gap-4">
              {item.menu.image_url ? (
                <div className="w-24 h-24 sm:w-20 sm:h-20 bg-muted rounded-xl shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                  {item.menu.image_url.startsWith('http') || item.menu.image_url.startsWith('/') ? (
                    <img src={item.menu.image_url} alt={item.menu.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-white">
                      {item.menu.image_url}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-20 sm:h-20 bg-muted rounded-xl shrink-0 shadow-sm" />
              )}
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{item.menu.name}</h3>
                    <button 
                      onClick={() => removeItem(item.cartItemId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  {item.options.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.options.map(opt => opt.option_name).join(', ')}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="flex items-center gap-2 bg-secondary/40 rounded-full p-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-background shadow-sm transition-all active:scale-95"
                      onClick={() => updateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-medium w-6 text-center text-sm">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-background shadow-sm transition-all active:scale-95"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="font-bold text-lg">
                    {item.totalPrice.toLocaleString()}원
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checkout fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/70 border-t p-4 pb-8 z-40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="container max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground font-medium">총 결제금액</span>
            <span className="text-3xl font-extrabold text-foreground tracking-tight">{getTotalPrice().toLocaleString()}<span className="text-xl font-bold ml-0.5">원</span></span>
          </div>
          <Button 
            size="lg" 
            className="w-[140px] sm:w-[180px] rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 text-base font-semibold"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? '처리중...' : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                결제하기
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShoppingCartIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
