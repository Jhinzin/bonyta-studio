-- Agenda pública da landing:
-- 1) define expediente das profissionais
-- 2) calcula horários livres sem expor dados das clientes
-- 3) cria cliente + agendamento online com trava contra duplicidade

create table if not exists public.professional_working_hours (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6), -- 0 domingo, 6 sábado
  starts_at time not null default '08:00',
  ends_at time not null default '18:00',
  break_starts_at time,
  break_ends_at time,
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint professional_working_hours_valid_range check (starts_at < ends_at),
  constraint professional_working_hours_valid_break check (
    break_starts_at is null
    or break_ends_at is null
    or (starts_at <= break_starts_at and break_starts_at < break_ends_at and break_ends_at <= ends_at)
  ),
  constraint professional_working_hours_unique_day unique (professional_id, weekday)
);

create table if not exists public.professional_time_off (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  date date not null,
  starts_at time,
  ends_at time,
  all_day boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),
  constraint professional_time_off_valid_range check (
    all_day = true
    or (starts_at is not null and ends_at is not null and starts_at < ends_at)
  )
);

alter table public.booking_requests
  add column if not exists customer_birth_date date,
  add column if not exists customer_email text,
  add column if not exists selected_time time,
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null;

create index if not exists idx_professional_working_hours_prof_weekday
  on public.professional_working_hours(professional_id, weekday)
  where active = true;

create index if not exists idx_professional_time_off_prof_date
  on public.professional_time_off(professional_id, date);

alter table public.professional_working_hours enable row level security;
alter table public.professional_time_off enable row level security;

drop policy if exists professional_working_hours_staff_all on public.professional_working_hours;
drop policy if exists professional_time_off_staff_all on public.professional_time_off;

create policy professional_working_hours_staff_all on public.professional_working_hours
  for all to authenticated using (true) with check (true);

create policy professional_time_off_staff_all on public.professional_time_off
  for all to authenticated using (true) with check (true);

grant all on public.professional_working_hours, public.professional_time_off to authenticated;

-- Expediente inicial gratuito: segunda a sábado, 08h às 18h, pausa 12h-13h.
-- Depois podemos criar uma tela no app para editar isso por profissional.
insert into public.professional_working_hours (
  professional_id,
  weekday,
  starts_at,
  ends_at,
  break_starts_at,
  break_ends_at,
  slot_interval_minutes
)
select
  p.id,
  d.weekday,
  '08:00'::time,
  '18:00'::time,
  '12:00'::time,
  '13:00'::time,
  30
from public.professionals p
cross join (values (1), (2), (3), (4), (5), (6)) as d(weekday)
where coalesce(p.active, true) = true
on conflict (professional_id, weekday) do nothing;

drop function if exists public.public_get_available_slots(uuid, uuid, date);

create or replace function public.public_get_available_slots(
  p_service_id uuid,
  p_professional_id uuid default null,
  p_date date default current_date
)
returns table (
  professional_id uuid,
  professional_name text,
  slot_time time,
  slot_label text
)
language sql
stable
security definer
set search_path = public
as $$
  with selected_service as (
    select id, name, duration_minutes
    from public.services
    where id = p_service_id
      and active = true
    limit 1
  ),
  candidate_professionals as (
    select id, name
    from public.professionals
    where active = true
      and (p_professional_id is null or id = p_professional_id)
  ),
  raw_slots as (
    select
      p.id as professional_id,
      p.name as professional_name,
      slot.starts_at,
      slot.starts_at + make_interval(mins => s.duration_minutes) as ends_at
    from selected_service s
    join candidate_professionals p on true
    join public.professional_working_hours wh
      on wh.professional_id = p.id
     and wh.weekday = extract(dow from p_date)::integer
     and wh.active = true
    cross join lateral generate_series(
      (p_date + wh.starts_at)::timestamp,
      (p_date + wh.ends_at)::timestamp - make_interval(mins => s.duration_minutes),
      make_interval(mins => wh.slot_interval_minutes)
    ) as slot(starts_at)
    where p_date >= current_date
      and (
        p_date > current_date
        or slot.starts_at > now() + interval '30 minutes'
      )
      and not (
        wh.break_starts_at is not null
        and wh.break_ends_at is not null
        and slot.starts_at < (p_date + wh.break_ends_at)::timestamp
        and slot.starts_at + make_interval(mins => s.duration_minutes) > (p_date + wh.break_starts_at)::timestamp
      )
  )
  select
    rs.professional_id,
    rs.professional_name,
    rs.starts_at::time as slot_time,
    to_char(rs.starts_at, 'HH24:MI') as slot_label
  from raw_slots rs
  where not exists (
    select 1
    from public.appointments a
    where a.professional_id = rs.professional_id
      and a.date = p_date
      and coalesce(a.status, '') <> 'cancelado'
      and (a.date + a.time)::timestamp < rs.ends_at
      and (a.date + a.time)::timestamp + make_interval(mins => coalesce(a.duration_minutes, 60)) > rs.starts_at
  )
  and not exists (
    select 1
    from public.professional_time_off t
    where t.professional_id = rs.professional_id
      and t.date = p_date
      and (
        t.all_day = true
        or (
          rs.starts_at < (t.date + t.ends_at)::timestamp
          and rs.ends_at > (t.date + t.starts_at)::timestamp
        )
      )
  )
  order by rs.starts_at, rs.professional_name;
$$;

drop function if exists public.public_create_online_booking(
  uuid,
  uuid,
  date,
  time,
  text,
  text,
  date,
  text,
  text
);

create or replace function public.public_create_online_booking(
  p_service_id uuid,
  p_professional_id uuid,
  p_date date,
  p_time time,
  p_customer_name text,
  p_customer_phone text,
  p_customer_birth_date date default null,
  p_customer_email text default null,
  p_note text default null
)
returns table (
  appointment_id uuid,
  client_id uuid,
  professional_id uuid,
  professional_name text,
  service_name text,
  appointment_date date,
  appointment_time time,
  whatsapp_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_professional public.professionals%rowtype;
  v_client_id uuid;
  v_appointment_id uuid;
  v_phone_digits text;
  v_period text;
begin
  if p_service_id is null or p_professional_id is null or p_date is null or p_time is null then
    raise exception 'Escolha serviço, profissional, data e horário.';
  end if;

  if nullif(trim(p_customer_name), '') is null then
    raise exception 'Informe seu nome.';
  end if;

  v_phone_digits := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  if length(v_phone_digits) < 10 then
    raise exception 'Informe um WhatsApp válido.';
  end if;

  if p_date < current_date then
    raise exception 'Escolha uma data futura.';
  end if;

  select *
    into v_service
  from public.services
  where id = p_service_id
    and active = true
  limit 1;

  if v_service.id is null then
    raise exception 'Serviço indisponível.';
  end if;

  select *
    into v_professional
  from public.professionals
  where id = p_professional_id
    and active = true
  limit 1;

  if v_professional.id is null then
    raise exception 'Profissional indisponível.';
  end if;

  -- Trava todas as tentativas da mesma profissional no mesmo dia dentro da transação.
  -- Assim evitamos duas clientes pegando horários sobrepostos ao mesmo tempo.
  perform pg_advisory_xact_lock(hashtext('bonyta-booking:' || p_professional_id::text || ':' || p_date::text));

  if not exists (
    select 1
    from public.public_get_available_slots(p_service_id, p_professional_id, p_date) slots
    where slots.professional_id = p_professional_id
      and slots.slot_time = p_time
  ) then
    raise exception 'Esse horário acabou de ficar indisponível. Escolha outro horário.';
  end if;

  select c.id
    into v_client_id
  from public.clients c
  where regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone_digits
  order by c.created_at desc
  limit 1;

  if v_client_id is null then
    insert into public.clients (
      name,
      phone,
      birth_date,
      email,
      observation
    ) values (
      trim(p_customer_name),
      p_customer_phone,
      p_customer_birth_date,
      nullif(trim(coalesce(p_customer_email, '')), ''),
      nullif(trim(coalesce(p_note, '')), '')
    )
    returning id into v_client_id;
  else
    update public.clients
      set
        name = trim(p_customer_name),
        phone = p_customer_phone,
        birth_date = coalesce(p_customer_birth_date, birth_date),
        email = coalesce(nullif(trim(coalesce(p_customer_email, '')), ''), email),
        observation = coalesce(nullif(trim(coalesce(p_note, '')), ''), observation)
    where id = v_client_id;
  end if;

  insert into public.appointments (
    professional_id,
    client_id,
    service_id,
    client_name,
    service,
    date,
    time,
    duration_minutes,
    notes,
    observation,
    status,
    total_price,
    total_cost,
    payment_status,
    payment_method,
    amount_paid
  ) values (
    p_professional_id,
    v_client_id,
    p_service_id,
    trim(p_customer_name),
    v_service.name,
    p_date,
    p_time,
    v_service.duration_minutes,
    nullif(trim(coalesce(p_note, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    'pendente',
    v_service.price,
    v_service.material_cost,
    'aberto',
    'nao_informado',
    0
  )
  returning id into v_appointment_id;

  v_period := case
    when p_time < '12:00'::time then 'manha'
    when p_time < '18:00'::time then 'tarde'
    else 'noite'
  end;

  insert into public.booking_requests (
    customer_name,
    customer_phone,
    customer_birth_date,
    customer_email,
    service_id,
    professional_id,
    preferred_date,
    preferred_period,
    selected_time,
    note,
    status,
    appointment_id
  ) values (
    trim(p_customer_name),
    p_customer_phone,
    p_customer_birth_date,
    nullif(trim(coalesce(p_customer_email, '')), ''),
    p_service_id,
    p_professional_id,
    p_date,
    v_period,
    p_time,
    nullif(trim(coalesce(p_note, '')), ''),
    'scheduled',
    v_appointment_id
  );

  return query
  select
    v_appointment_id,
    v_client_id,
    v_professional.id,
    v_professional.name,
    v_service.name,
    p_date,
    p_time,
    concat(
      'Novo agendamento online Bonyta Studio', chr(10),
      'Cliente: ', trim(p_customer_name), chr(10),
      'WhatsApp: ', p_customer_phone, chr(10),
      'Serviço: ', v_service.name, chr(10),
      'Profissional: ', v_professional.name, chr(10),
      'Data: ', to_char(p_date, 'DD/MM/YYYY'), chr(10),
      'Horário: ', to_char(p_time, 'HH24:MI')
    );
end;
$$;

grant execute on function public.public_get_available_slots(uuid, uuid, date) to anon, authenticated;
grant execute on function public.public_create_online_booking(uuid, uuid, date, time, text, text, date, text, text) to anon, authenticated;
