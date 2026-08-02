'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface OrderStatusTrackerProps {
  initialOrder: any; // We use any here for MVP, but should type properly
}

const STATUS_STEPS = ['접수대기', '제조중', '픽업완료', '취소됨'];

export default function OrderStatusTracker({ initialOrder }: OrderStatusTrackerProps) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setOrder((prev: any) => ({ ...prev, status: newStatus }));
          
          // Mock Notification (Console & Toast)
          if (newStatus === '제조중') {
            const msg = '[알림톡 발송] 고객님의 메뉴가 제조되기 시작했습니다.';
            console.log(msg);
            toast.success(msg, { duration: 5000 });
          } else if (newStatus === '픽업완료') {
            const msg = '[알림톡 발송] 메뉴 준비가 완료되었습니다. 픽업대로 와주세요!';
            console.log(msg);
            toast.success(msg, { duration: 5000 });
          } else if (newStatus === '취소됨') {
            const msg = '[알림톡 발송] 주문이 취소되었습니다. 결제가 환불됩니다.';
            console.log(msg);
            toast.error(msg, { duration: 5000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === '취소됨';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>주문 번호: <span className="text-primary">{order.id.split('-')[0]}</span></CardTitle>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
        </CardHeader>
        <CardContent>
          {isCancelled ? (
            <div className="text-center py-6 bg-destructive/10 text-destructive rounded-md font-bold text-lg">
              이 주문은 취소되었습니다.
            </div>
          ) : (
            <div className="relative pt-8 pb-4">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-secondary">
                <div 
                  style={{ width: `${(currentStep / 2) * 100}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className={currentStep >= 0 ? 'text-primary font-bold' : 'text-muted-foreground'}>접수 대기</span>
                <span className={currentStep >= 1 ? 'text-primary font-bold' : 'text-muted-foreground'}>제조 중</span>
                <span className={currentStep >= 2 ? 'text-primary font-bold' : 'text-muted-foreground'}>픽업 완료</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>주문 상세</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{item.menus.name} <span className="text-muted-foreground">x{item.quantity}</span></p>
                {/* Options mapping would go here if we populated options in the query */}
              </div>
              <p className="font-bold">{(item.unit_price * item.quantity).toLocaleString()}원</p>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 text-lg font-bold">
            <span>총 결제금액</span>
            <span className="text-primary">{order.total_price.toLocaleString()}원</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
