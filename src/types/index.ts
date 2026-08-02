export interface Menu {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  is_sold_out: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuOption {
  id: string;
  menu_id: string;
  option_name: string;
  extra_price: number;
  created_at: string;
}

export interface StoreSetting {
  id: string;
  status: 'OPEN' | 'PAUSE' | 'CLOSE';
  updated_at: string;
}

export interface CartItem {
  cartItemId: string; // 장바구니 구별용 고유 ID
  menu: Menu;
  quantity: number;
  options: MenuOption[];
  totalPrice: number; // 메뉴 기본가 + 옵션가 * 수량
}

