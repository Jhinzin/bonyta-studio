-- Produtos e extras usados na comanda dos atendimentos.
-- Execute no SQL Editor do Supabase depois da migration base.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  cost numeric(10,2) not null default 0 check (cost >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists price numeric(10,2) not null default 0,
  add column if not exists cost numeric(10,2) not null default 0,
  add column if not exists stock_quantity integer not null default 0,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_products_active_name
  on public.products(active, name);

alter table public.products enable row level security;

drop policy if exists products_staff_all on public.products;

create policy products_staff_all on public.products
  for all to authenticated using (true) with check (true);

grant all on public.products to authenticated;
