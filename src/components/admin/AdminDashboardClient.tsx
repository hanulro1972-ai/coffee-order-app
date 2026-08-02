'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminDashboardClient({ 
  initialStoreSettings, 
  initialOrders 
}: { 
  initialStoreSettings: any, 
  initialOrders: any[] 
}) {
  const [storeStatus, setStoreStatus] = useState(initialStoreSettings.status);
  const [orders, setOrders] = useState<any[]>(initialOrders);
  
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.info('새로운 주문이 접수되었습니다!');
            // Fetch order with items
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*, menus(*))')
              .eq('id', payload.new.id)
              .single();
            if (data) {
              setOrders(prev => [data, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStoreStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('store_settings')
      .update({ status: newStatus })
      .eq('id', initialStoreSettings.id);
      
    if (!error) {
      setStoreStatus(newStatus);
      toast.success(`매장 상태가 [${newStatus}](으)로 변경되었습니다.`);
    } else {
      toast.error('매장 상태 변경 실패');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
      
    if (!error) {
      toast.success('주문 상태가 변경되었습니다.');
      // If cancelling, simulate PG refund
      if (newStatus === '취소됨') {
        toast.info('PG사 결제 취소가 완료되었습니다. (Mock)');
      }
    } else {
      toast.error('상태 변경 실패');
    }
  };

  // Filter out completed/cancelled unless we want to show a history tab
  const activeOrders = orders.filter(o => ['접수대기', '제조중'].includes(o.status));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">매장 영업 상태</h1>
        <div className="flex gap-4">
          <Button 
            variant={storeStatus === 'OPEN' ? 'default' : 'outline'} 
            onClick={() => handleUpdateStoreStatus('OPEN')}
          >
            영업 중 (OPEN)
          </Button>
          <Button 
            variant={storeStatus === 'PAUSE' ? 'destructive' : 'outline'} 
            onClick={() => handleUpdateStoreStatus('PAUSE')}
          >
            주문 일시 정지 (PAUSE)
          </Button>
          <Button 
            variant={storeStatus === 'CLOSE' ? 'secondary' : 'outline'} 
            onClick={() => handleUpdateStoreStatus('CLOSE')}
          >
            영업 종료 (CLOSE)
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">실시간 주문 관리 ({activeOrders.length})</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map(order => (
            <Card key={order.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">주문 {order.id.split('-')[0]}</CardTitle>
                    <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className={`px-2 py-1 text-xs font-bold rounded ${
                    order.status === '접수대기' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-md space-y-2">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-medium">{item.menus.name} x{item.quantity}</span>
                      <span>{(item.unit_price * item.quantity).toLocaleString()}원</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>총액</span>
                    <span>{order.total_price.toLocaleString()}원</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === '접수대기' && (
                    <Button 
                      className="flex-1" 
                      onClick={() => handleUpdateOrderStatus(order.id, '제조중')}
                    >
                      제조 시작
                    </Button>
                  )}
                  {order.status === '제조중' && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => handleUpdateOrderStatus(order.id, '픽업완료')}
                    >
                      픽업 완료 처리
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    className="flex-none"
                    onClick={() => {
                      if (confirm('정말 이 주문을 취소하시겠습니까? 결제도 환불됩니다.')) {
                        handleUpdateOrderStatus(order.id, '취소됨');
                      }
                    }}
                  >
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {activeOrders.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/50 rounded-lg border border-dashed">
              진행 중인 주문이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
