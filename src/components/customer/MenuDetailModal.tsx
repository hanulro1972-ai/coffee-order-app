'use client';

import { useState, useEffect } from 'react';
import { Menu, MenuOption } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/useCartStore';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface MenuDetailModalProps {
  menu: Menu | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuDetailModal({ menu, isOpen, onClose }: MenuDetailModalProps) {
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<MenuOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    if (menu && isOpen) {
      const fetchOptions = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from('menu_options')
          .select('*')
          .eq('menu_id', menu.id);
        
        if (data) {
          setOptions(data);
        }
        setIsLoading(false);
        // Reset state
        setSelectedOptions([]);
        setQuantity(1);
      };
      
      fetchOptions();
    }
  }, [menu, isOpen]);

  if (!menu) return null;

  const handleOptionToggle = (option: MenuOption) => {
    setSelectedOptions(prev => {
      const isSelected = prev.find(o => o.id === option.id);
      if (isSelected) {
        return prev.filter(o => o.id !== option.id);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleIncreaseQuantity = () => {
    if (quantity < menu.stock_quantity) {
      setQuantity(q => q + 1);
    } else {
      toast.error('재고 수량을 초과할 수 없습니다.');
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const optionsTotalPrice = selectedOptions.reduce((sum, opt) => sum + opt.extra_price, 0);
  const unitPrice = menu.price + optionsTotalPrice;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem({
      cartItemId: uuidv4(),
      menu,
      quantity,
      options: selectedOptions,
      totalPrice
    });
    toast.success(`${menu.name} 장바구니에 추가되었습니다.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{menu.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Image */}
          {menu.image_url && (
            <div className="aspect-video w-full rounded-md overflow-hidden bg-muted">
              <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Description / Price */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">기본 가격</span>
            <span className="font-bold text-lg">{menu.price.toLocaleString()}원</span>
          </div>

          {/* Options */}
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">옵션 불러오는 중...</div>
          ) : (
            options.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">추가 옵션</h4>
                <div className="grid grid-cols-1 gap-2">
                  {options.map(option => (
                    <label
                      key={option.id}
                      className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedOptions.some(o => o.id === option.id)}
                          onChange={() => handleOptionToggle(option)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>{option.option_name}</span>
                      </div>
                      <span className="text-muted-foreground">+{option.extra_price.toLocaleString()}원</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Quantity */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="font-medium">수량</span>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={handleDecreaseQuantity} disabled={quantity <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-6 text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={handleIncreaseQuantity} disabled={quantity >= menu.stock_quantity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            취소
          </Button>
          <Button className="w-full sm:w-auto flex-1" onClick={handleAddToCart}>
            {totalPrice.toLocaleString()}원 장바구니 담기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
