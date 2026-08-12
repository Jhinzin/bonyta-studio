-- Solicitações enviadas pela landing pública /agendar.
-- Permite captar pedidos sem pagar API de WhatsApp ou ferramenta de agendamento externa.

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  service_id uuid references public.services(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  preferred_date date not null,
  preferred_period text not null default 'tarde'
    check (preferred_period in ('manha', 'tarde', 'noite')),
  note text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'scheduled', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_requests_status_date
  on public.booking_requests(status, preferred_date, created_at);

alter table public.booking_requests enable row level security;

drop policy if exists booking_requests_public_insert on public.booking_requests;
drop policy if exists booking_requests_staff_all on public.booking_requests;

create policy booking_requests_public_insert on public.booking_requests
  for insert to anon with check (true);

create policy booking_requests_staff_all on public.booking_requests
  for all to authenticated using (true) with check (true);

grant insert on public.booking_requests to anon;
grant all on public.booking_requests to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'booking_requests'
  ) then
    alter publication supabase_realtime add table public.booking_requests;
  end if;
end $$;
