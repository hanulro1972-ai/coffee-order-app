-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users 
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text,
  oauth_provider text,
  role text not null check (role in ('GUEST', 'USER', 'ADMIN')) default 'GUEST',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- StoreSettings
create table public.store_settings (
  id uuid primary key default uuid_generate_v4(),
  status text not null check (status in ('OPEN', 'PAUSE', 'CLOSE')) default 'OPEN',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Menus
create table public.menus (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  price integer not null,
  stock_quantity integer not null default 0,
  is_sold_out boolean not null default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MenuOptions
create table public.menu_options (
  id uuid primary key default uuid_generate_v4(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  option_name text not null,
  extra_price integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id), -- nullable for guest
  guest_name text, -- useful for guest pickup
  idempotency_key text unique not null,
  total_price integer not null,
  status text not null check (status in ('접수대기', '제조중', '픽업완료', '취소됨')) default '접수대기',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- OrderItems
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete restrict,
  quantity integer not null,
  unit_price integer not null,
  selected_option_ids jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security) - MVP allows anon access for now
alter table public.users enable row level security;
alter table public.store_settings enable row level security;
alter table public.menus enable row level security;
alter table public.menu_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Create policies (For MVP, allow anon access to everything for simplicity)
create policy "Allow public read access on store_settings" on public.store_settings for select using (true);
create policy "Allow public read access on menus" on public.menus for select using (true);
create policy "Allow public read access on menu_options" on public.menu_options for select using (true);

-- Allow guests to create orders and order_items
create policy "Allow public insert on orders" on public.orders for insert with check (true);
create policy "Allow public select on orders" on public.orders for select using (true);
create policy "Allow public update on orders" on public.orders for update using (true);

create policy "Allow public insert on order_items" on public.order_items for insert with check (true);
create policy "Allow public select on order_items" on public.order_items for select using (true);

-- Allow admin full access
create policy "Allow all on store_settings" on public.store_settings using (true);
create policy "Allow all on menus" on public.menus using (true);
create policy "Allow all on menu_options" on public.menu_options using (true);

-- Realtime settings
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.store_settings;

-- Insert default store settings
insert into public.store_settings (status) values ('OPEN');

-- Insert some dummy menus
insert into public.menus (name, category, price, stock_quantity, image_url) values 
('아메리카노', 'COFFEE', 4500, 100, 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80'),
('카페라떼', 'COFFEE', 5000, 50, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&q=80'),
('바닐라라떼', 'COFFEE', 5500, 30, 'https://images.unsplash.com/photo-1585494156145-1c60a44a2925?w=500&q=80'),
('자몽에이드', 'NON-COFFEE', 6000, 20, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80');

-- Insert some dummy options
insert into public.menu_options (menu_id, option_name, extra_price) 
select id, '샷 추가', 500 from public.menus where category = 'COFFEE';
insert into public.menu_options (menu_id, option_name, extra_price) 
select id, '디카페인 변경', 300 from public.menus where category = 'COFFEE';
insert into public.menu_options (menu_id, option_name, extra_price) 
select id, '시럽 추가', 500 from public.menus;
