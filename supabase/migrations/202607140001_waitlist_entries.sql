-- Lista de espera persistente para o painel interno da Bonyta.
-- Execute este arquivo no SQL Editor do Supabase depois da migration base.

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  preferred_date date not null,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'booked', 'removed')),
  note text,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

create index if not exists idx_waitlist_entries_date
  on public.waitlist_entries(preferred_date, status);

create index if not exists idx_waitlist_entries_client
  on public.waitlist_entries(client_id);

alter table public.waitlist_entries enable row level security;

drop policy if exists waitlist_entries_staff_all on public.waitlist_entries;

create policy waitlist_entries_staff_all on public.waitlist_entries
  for all to authenticated using (true) with check (true);

grant all on public.waitlist_entries to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'waitlist_entries'
  ) then
    alter publication supabase_realtime add table public.waitlist_entries;
  end if;
end $$;
