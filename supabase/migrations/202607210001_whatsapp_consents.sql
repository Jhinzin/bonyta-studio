-- Consentimentos coletados na landing para comunicação pelo WhatsApp.
-- Confirmações/lembretes operacionais são separados de manutenção/novidades.

alter table public.clients
  add column if not exists whatsapp_transactional_opt_in boolean not null default false,
  add column if not exists whatsapp_transactional_opt_in_at timestamptz,
  add column if not exists whatsapp_marketing_opt_in boolean not null default false,
  add column if not exists whatsapp_marketing_opt_in_at timestamptz,
  add column if not exists whatsapp_opt_in_source text;

alter table public.booking_requests
  add column if not exists whatsapp_transactional_opt_in boolean not null default false,
  add column if not exists whatsapp_marketing_opt_in boolean not null default false,
  add column if not exists whatsapp_opt_in_at timestamptz;

create or replace function public.public_register_booking_consents(
  p_appointment_id uuid,
  p_customer_phone text,
  p_transactional boolean,
  p_marketing boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_phone_digits text;
begin
  if p_appointment_id is null then
    raise exception 'Agendamento não informado.';
  end if;

  if coalesce(p_transactional, false) = false then
    raise exception 'É necessário autorizar as mensagens relacionadas ao agendamento.';
  end if;

  v_phone_digits := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');

  select appointment.client_id
    into v_client_id
  from public.appointments appointment
  join public.clients client on client.id = appointment.client_id
  where appointment.id = p_appointment_id
    and regexp_replace(coalesce(client.phone, ''), '\D', '', 'g') = v_phone_digits
  limit 1;

  if v_client_id is null then
    raise exception 'Não foi possível validar o agendamento e o WhatsApp informado.';
  end if;

  update public.clients
    set
      whatsapp_transactional_opt_in = true,
      whatsapp_transactional_opt_in_at = now(),
      whatsapp_marketing_opt_in = coalesce(p_marketing, false),
      whatsapp_marketing_opt_in_at = case when coalesce(p_marketing, false) then now() else null end,
      whatsapp_opt_in_source = 'landing_booking'
  where id = v_client_id;

  update public.booking_requests
    set
      whatsapp_transactional_opt_in = true,
      whatsapp_marketing_opt_in = coalesce(p_marketing, false),
      whatsapp_opt_in_at = now()
  where appointment_id = p_appointment_id;
end;
$$;

revoke all on function public.public_register_booking_consents(uuid, text, boolean, boolean) from public;
grant execute on function public.public_register_booking_consents(uuid, text, boolean, boolean) to anon, authenticated;

