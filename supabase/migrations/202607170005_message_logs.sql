-- Registro gratuito/manual de mensagens.
-- O app abre o WhatsApp com texto pronto e registra aqui que a mensagem foi preparada/enviada.

create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  booking_request_id uuid references public.booking_requests(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  message_type text not null default 'whatsapp',
  channel text not null default 'whatsapp',
  recipient_name text,
  recipient_phone text,
  message_body text,
  status text not null default 'sent'
    check (status in ('prepared', 'sent', 'failed')),
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists message_logs_client_id_idx on public.message_logs(client_id);
create index if not exists message_logs_appointment_id_idx on public.message_logs(appointment_id);
create index if not exists message_logs_booking_request_id_idx on public.message_logs(booking_request_id);
create index if not exists message_logs_sent_at_idx on public.message_logs(sent_at desc);

alter table public.message_logs enable row level security;

drop policy if exists message_logs_owner_manager_all on public.message_logs;
drop policy if exists message_logs_professional_own_select on public.message_logs;
drop policy if exists message_logs_authenticated_insert on public.message_logs;

create policy message_logs_owner_manager_all on public.message_logs
  for all to authenticated
  using (
    exists (
      select 1
      from public.app_user_profiles profile
      where profile.user_id = auth.uid()
        and profile.active = true
        and profile.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1
      from public.app_user_profiles profile
      where profile.user_id = auth.uid()
        and profile.active = true
        and profile.role in ('owner', 'manager')
    )
  );

create policy message_logs_professional_own_select on public.message_logs
  for select to authenticated
  using (
    exists (
      select 1
      from public.app_user_profiles profile
      where profile.user_id = auth.uid()
        and profile.active = true
        and profile.role = 'professional'
        and profile.professional_id = message_logs.professional_id
    )
  );

create policy message_logs_authenticated_insert on public.message_logs
  for insert to authenticated
  with check (
    sent_by = auth.uid()
    and (
      exists (
        select 1
        from public.app_user_profiles profile
        where profile.user_id = auth.uid()
          and profile.active = true
          and profile.role in ('owner', 'manager')
      )
      or exists (
        select 1
        from public.app_user_profiles profile
        where profile.user_id = auth.uid()
          and profile.active = true
          and profile.role = 'professional'
          and profile.professional_id = message_logs.professional_id
      )
    )
  );

grant select, insert, update, delete on public.message_logs to authenticated;
