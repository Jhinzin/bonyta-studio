-- Bonyta Studio: base gratuita e segura para agenda, catálogo e painel interno.
-- Antes de executar, crie pelo menos um usuário em Authentication > Users.

alter table public.professionals
  add column if not exists specialty text,
  add column if not exists active boolean not null default true;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  cpf text,
  birth_date date,
  email text,
  address text,
  observation text,
  created_at timestamptz not null default now()
);

alter table public.clients
  add column if not exists phone text,
  add column if not exists cpf text,
  add column if not exists birth_date date,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists observation text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  material_cost numeric(10,2) not null default 0 check (material_cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- A tabela services pode ter sido criada por uma versão anterior do app.
-- CREATE TABLE IF NOT EXISTS não adiciona colunas ausentes em tabelas existentes.
alter table public.services
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists price numeric(10,2) not null default 0,
  add column if not exists material_cost numeric(10,2) not null default 0,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

alter table public.appointments
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists service_id uuid references public.services(id) on delete set null,
  add column if not exists observation text,
  add column if not exists status text not null default 'pendente',
  add column if not exists is_block boolean not null default false,
  add column if not exists total_price numeric(10,2) not null default 0,
  add column if not exists total_cost numeric(10,2) not null default 0,
  add column if not exists comanda_json jsonb;

create index if not exists idx_appointments_professional_date_time
  on public.appointments(professional_id, date, time);

create unique index if not exists uq_appointments_exact_slot
  on public.appointments(professional_id, date, time)
  where status <> 'cancelado';

alter table public.professionals enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

drop policy if exists professionals_select on public.professionals;
drop policy if exists appointments_select on public.appointments;
drop policy if exists appointments_insert on public.appointments;
drop policy if exists appointments_update on public.appointments;
drop policy if exists appointments_delete on public.appointments;
drop policy if exists professionals_public_catalog on public.professionals;
drop policy if exists professionals_staff_all on public.professionals;
drop policy if exists services_public_catalog on public.services;
drop policy if exists services_staff_all on public.services;
drop policy if exists clients_staff_all on public.clients;
drop policy if exists appointments_staff_all on public.appointments;

create policy professionals_public_catalog on public.professionals
  for select to anon using (active = true);
create policy professionals_staff_all on public.professionals
  for all to authenticated using (true) with check (true);

create policy services_public_catalog on public.services
  for select to anon using (active = true);
create policy services_staff_all on public.services
  for all to authenticated using (true) with check (true);

create policy clients_staff_all on public.clients
  for all to authenticated using (true) with check (true);
create policy appointments_staff_all on public.appointments
  for all to authenticated using (true) with check (true);

revoke all on public.professionals, public.services, public.clients, public.appointments from anon;
grant select on public.professionals, public.services to anon;
grant all on public.professionals, public.clients, public.services, public.appointments to authenticated;

-- Realtime pode já estar configurado; este bloco evita erro ao repetir a migration.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end $$;
