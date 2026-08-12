-- Fila persistente do Bonyta Assistant.
-- O Telegram avisa a equipe, abre o WhatsApp com texto pronto e registra quando a cliente foi contatada.

create table if not exists public.assistant_tasks (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique,
  task_type text not null
    check (task_type in ('new_booking', 'appointment_reminder', 'maintenance', 'weekly_report')),
  client_id uuid references public.clients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  due_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'completed', 'dismissed', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  telegram_message_id bigint,
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assistant_tasks_dispatch_idx
  on public.assistant_tasks(status, due_at);
create index if not exists assistant_tasks_client_idx
  on public.assistant_tasks(client_id, task_type, due_at desc);
create index if not exists assistant_tasks_appointment_idx
  on public.assistant_tasks(appointment_id);

create or replace function public.bonyta_normalize_text(p_text text)
returns text
language sql
immutable
as $$
  select translate(
    lower(coalesce(p_text, '')),
    'áàâãäéèêëíìîïóòôõöúùûüç',
    'aaaaaeeeeiiiiooooouuuuc'
  );
$$;

create or replace function public.bonyta_maintenance_days(p_service text)
returns integer
language sql
immutable
as $$
  select case
    when public.bonyta_normalize_text(p_service) ~ '(cilio|lash|volume|sphinx|fox|bloom|amabbi|lux|catwalk|pipoca)' then 20
    when public.bonyta_normalize_text(p_service) ~ '(unha|nail|fibra|molde|f1|banho de gel|esmaltacao|reconstrucao|postica)' then 21
    when public.bonyta_normalize_text(p_service) ~ '(sobrancelha|brow|design|henna|lamination|depilacao)' then 30
    else 30
  end;
$$;

create or replace function public.queue_new_booking_for_assistant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_due_at timestamptz;
begin
  if coalesce(new.is_block, false) or new.status = 'cancelado' then
    return new;
  end if;

  v_due_at := now();

  insert into public.assistant_tasks (
    task_key,
    task_type,
    client_id,
    appointment_id,
    professional_id,
    due_at
  ) values (
    'new_booking:' || new.id::text,
    'new_booking',
    new.client_id,
    new.id,
    new.professional_id,
    v_due_at
  )
  on conflict (task_key) do nothing;

  return new;
end;
$$;

drop trigger if exists appointments_queue_bonyta_assistant on public.appointments;
create trigger appointments_queue_bonyta_assistant
  after insert on public.appointments
  for each row
  execute function public.queue_new_booking_for_assistant();

create or replace function public.refresh_bonyta_assistant_tasks()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local_now timestamp := timezone('America/Sao_Paulo', now());
  v_week_start date;
  v_week_end date;
  v_reminders integer := 0;
  v_maintenance integer := 0;
  v_weekly integer := 0;
begin
  -- Lembrete operacional: entra na fila 24 horas antes do atendimento.
  insert into public.assistant_tasks (
    task_key,
    task_type,
    client_id,
    appointment_id,
    professional_id,
    due_at
  )
  select
    'appointment_reminder:' || appointment.id::text,
    'appointment_reminder',
    appointment.client_id,
    appointment.id,
    appointment.professional_id,
    ((appointment.date + coalesce(appointment.time, '12:00'::time)) at time zone 'America/Sao_Paulo') - interval '24 hours'
  from public.appointments appointment
  where coalesce(appointment.is_block, false) = false
    and appointment.status in ('pendente', 'confirmado')
    and ((appointment.date + coalesce(appointment.time, '12:00'::time)) at time zone 'America/Sao_Paulo') > now()
    and not exists (
      select 1
      from public.message_logs log
      where log.appointment_id = appointment.id
        and log.message_type = 'lembrete'
        and log.status <> 'failed'
    )
  on conflict (task_key) do nothing;
  get diagnostics v_reminders = row_count;

  -- Manutenção: usa somente o atendimento concluído mais recente de cada cliente e categoria.
  with completed as (
    select
      appointment.*,
      public.bonyta_maintenance_days(appointment.service) as maintenance_days,
      case
        when public.bonyta_maintenance_days(appointment.service) = 20 then 'cilios'
        when public.bonyta_maintenance_days(appointment.service) = 21 then 'unhas'
        else 'sobrancelhas_ou_retorno'
      end as maintenance_category,
      row_number() over (
        partition by appointment.client_id,
          case
            when public.bonyta_maintenance_days(appointment.service) = 20 then 'cilios'
            when public.bonyta_maintenance_days(appointment.service) = 21 then 'unhas'
            else 'sobrancelhas_ou_retorno'
          end
        order by appointment.date desc, appointment.time desc
      ) as position
    from public.appointments appointment
    where coalesce(appointment.is_block, false) = false
      and appointment.status = 'concluido'
      and appointment.client_id is not null
  )
  insert into public.assistant_tasks (
    task_key,
    task_type,
    client_id,
    appointment_id,
    professional_id,
    due_at,
    payload
  )
  select
    'maintenance:' || completed.id::text,
    'maintenance',
    completed.client_id,
    completed.id,
    completed.professional_id,
    (((completed.date + coalesce(completed.time, '12:00'::time)) at time zone 'America/Sao_Paulo')
      + make_interval(days => completed.maintenance_days)),
    jsonb_build_object(
      'maintenance_days', completed.maintenance_days,
      'maintenance_category', completed.maintenance_category
    )
  from completed
  where completed.position = 1
    and not exists (
      select 1
      from public.appointments future
      where future.client_id = completed.client_id
        and coalesce(future.is_block, false) = false
        and future.status <> 'cancelado'
        and ((future.date + coalesce(future.time, '12:00'::time)) at time zone 'America/Sao_Paulo') > now()
    )
    and not exists (
      select 1
      from public.message_logs log
      where log.appointment_id = completed.id
        and log.message_type = 'manutencao'
        and log.status <> 'failed'
    )
  on conflict (task_key) do nothing;
  get diagnostics v_maintenance = row_count;

  -- Domingo, a partir das 18h, cria um único relatório da próxima terça até sábado.
  if extract(dow from v_local_now) = 0 and v_local_now::time >= '18:00'::time then
    v_week_start := v_local_now::date + 2;
    v_week_end := v_week_start + 4;

    insert into public.assistant_tasks (
      task_key,
      task_type,
      due_at,
      payload
    ) values (
      'weekly_report:' || v_week_start::text,
      'weekly_report',
      now(),
      jsonb_build_object('start_date', v_week_start, 'end_date', v_week_end)
    )
    on conflict (task_key) do nothing;
    get diagnostics v_weekly = row_count;
  end if;

  return jsonb_build_object(
    'appointment_reminders_created', v_reminders,
    'maintenance_tasks_created', v_maintenance,
    'weekly_reports_created', v_weekly
  );
end;
$$;

create or replace function public.touch_assistant_task_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists assistant_tasks_touch_updated_at on public.assistant_tasks;
create trigger assistant_tasks_touch_updated_at
  before update on public.assistant_tasks
  for each row execute function public.touch_assistant_task_updated_at();

alter table public.assistant_tasks enable row level security;

drop policy if exists assistant_tasks_owner_manager_all on public.assistant_tasks;
drop policy if exists assistant_tasks_professional_own_select on public.assistant_tasks;

create policy assistant_tasks_owner_manager_all on public.assistant_tasks
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

create policy assistant_tasks_professional_own_select on public.assistant_tasks
  for select to authenticated
  using (
    exists (
      select 1
      from public.app_user_profiles profile
      where profile.user_id = auth.uid()
        and profile.active = true
        and profile.role = 'professional'
        and profile.professional_id = assistant_tasks.professional_id
    )
  );

grant select, insert, update, delete on public.assistant_tasks to authenticated;
revoke all on function public.refresh_bonyta_assistant_tasks() from public;
grant execute on function public.refresh_bonyta_assistant_tasks() to service_role;
