-- ============================================================
-- Bonyta Studio - Schema Supabase
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase
-- e clique em "Run".
-- ============================================================

create extension if not exists "pgcrypto";

-- Tabela de profissionais (Bea, Carol, Maira S., etc.)
create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style_class text not null default 'pink', -- 'pink' | 'dark-pink' | 'black-theme'
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tabela de agendamentos
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  client_name text not null,
  service text not null,
  date date not null,
  time time not null,
  duration_minutes integer not null default 60,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_date on appointments(date);
create index if not exists idx_appointments_prof on appointments(professional_id);

-- Row Level Security
alter table professionals enable row level security;
alter table appointments enable row level security;

-- Políticas abertas: pensadas para uso interno do studio (sem login de
-- cliente final). Se no futuro vocês quiserem exigir login, troque
-- "using (true)" por checagens em auth.uid().
create policy "professionals_select" on professionals for select using (true);
create policy "appointments_select" on appointments for select using (true);
create policy "appointments_insert" on appointments for insert with check (true);
create policy "appointments_update" on appointments for update using (true);
create policy "appointments_delete" on appointments for delete using (true);

-- Habilita Realtime na tabela de agendamentos (para sincronizar entre
-- dispositivos automaticamente). Se der erro "already exists", ignore.
alter publication supabase_realtime add table appointments;

-- Dados iniciais, equivalentes aos profissionais que já existiam no app
insert into professionals (name, style_class) values
  ('Bea', 'pink'),
  ('Carol', 'dark-pink'),
  ('Maira S.', 'black-theme');
