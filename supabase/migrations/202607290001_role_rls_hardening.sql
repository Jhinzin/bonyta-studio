-- Hardening real de RLS por perfil para o app interno da Bonyta Studio.
--
-- Esta migration substitui as politicas iniciais permissivas (using true).
-- Regras:
-- - owner/manager ativos administram todos os registros internos;
-- - professional ativa acessa somente a propria agenda e dados vinculados;
-- - anon continua vendo apenas o catalogo ativo e criando solicitacoes publicas;
-- - funcoes publicas de agendamento continuam operando como security definer.

create or replace function public.is_app_owner_manager()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.app_user_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role in ('owner', 'manager')
  );
$$;

create or replace function public.current_app_professional_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select profile.professional_id
  from public.app_user_profiles profile
  where profile.user_id = auth.uid()
    and profile.active = true
    and profile.role = 'professional'
    and profile.professional_id is not null
  limit 1;
$$;

revoke all on function public.is_app_owner_manager() from public;
revoke all on function public.current_app_professional_id() from public;
grant execute on function public.is_app_owner_manager() to authenticated;
grant execute on function public.current_app_professional_id() to authenticated;

do $$
begin
  if not exists (
    select 1
    from public.app_user_profiles profile
    where profile.active = true
      and profile.role in ('owner', 'manager')
  ) then
    raise exception 'RLS nao aplicado: cadastre ao menos um owner/manager ativo em app_user_profiles.';
  end if;
end $$;

-- Perfis ausentes ou desativados falham de forma segura. O frontend usa este
-- retorno para bloquear a interface ate que owner/manager libere o acesso.
create or replace function public.get_current_app_profile()
returns table (
  user_id uuid,
  email text,
  role text,
  professional_id uuid,
  active boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    authenticated_user.id as user_id,
    authenticated_user.email::text as email,
    coalesce(profile.role, 'professional') as role,
    profile.professional_id,
    coalesce(profile.active, false) as active
  from auth.users authenticated_user
  left join public.app_user_profiles profile
    on profile.user_id = authenticated_user.id
  where authenticated_user.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_current_app_profile() from public;
grant execute on function public.get_current_app_profile() to authenticated;

-- Permite identificar clientes criadas manualmente por uma profissional antes
-- de existir o primeiro agendamento vinculado.
alter table public.clients
  add column if not exists created_by uuid references auth.users(id) on delete set null
  default auth.uid();

create index if not exists idx_clients_created_by
  on public.clients(created_by)
  where created_by is not null;

-- Remove todas as politicas antigas destas tabelas. Isso evita que uma politica
-- permissiva esquecida seja combinada com as novas politicas por OR.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'app_user_profiles',
        'professionals',
        'services',
        'clients',
        'appointments',
        'products',
        'waitlist_entries',
        'booking_requests',
        'professional_working_hours',
        'professional_time_off'
      ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

-- Perfis de acesso: cada usuario le o proprio perfil; owner/manager administra.
create policy app_user_profiles_own_select
  on public.app_user_profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy app_user_profiles_owner_manager_all
  on public.app_user_profiles
  for all to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

-- Profissionais: o catalogo publico ve somente profissionais ativas.
-- No app, owner/manager ve todas e professional ve apenas o proprio cadastro.
create policy professionals_public_active_select
  on public.professionals
  for select to anon
  using (active = true);

create policy professionals_staff_select
  on public.professionals
  for select to authenticated
  using (
    public.is_app_owner_manager()
    or id = public.current_app_professional_id()
  );

create policy professionals_owner_manager_insert
  on public.professionals
  for insert to authenticated
  with check (public.is_app_owner_manager());

create policy professionals_owner_manager_update
  on public.professionals
  for update to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy professionals_owner_manager_delete
  on public.professionals
  for delete to authenticated
  using (public.is_app_owner_manager());

-- Impede que chamadas anonimas pecam colunas financeiras do cadastro da equipe.
revoke select on table public.professionals from anon;
grant select (id, name, specialty, active) on table public.professionals to anon;

-- Servicos: catalogo ativo e publico; gestao somente por owner/manager.
create policy services_public_active_select
  on public.services
  for select to anon
  using (active = true);

create policy services_staff_select
  on public.services
  for select to authenticated
  using (
    public.is_app_owner_manager()
    or (public.current_app_professional_id() is not null and active = true)
  );

create policy services_owner_manager_insert
  on public.services
  for insert to authenticated
  with check (public.is_app_owner_manager());

create policy services_owner_manager_update
  on public.services
  for update to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy services_owner_manager_delete
  on public.services
  for delete to authenticated
  using (public.is_app_owner_manager());

revoke select on table public.services from anon;
grant select (id, name, duration_minutes, price, active, created_at)
  on table public.services to anon;

-- Clientes: owner/manager ve todas. A profissional ve clientes que ela criou
-- ou que possuem atendimento na agenda dela.
create policy clients_owner_manager_all
  on public.clients
  for all to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy clients_professional_select
  on public.clients
  for select to authenticated
  using (
    public.current_app_professional_id() is not null
    and (
      created_by = auth.uid()
      or exists (
        select 1
        from public.appointments appointment
        where appointment.client_id = clients.id
          and appointment.professional_id = public.current_app_professional_id()
      )
    )
  );

create policy clients_professional_insert
  on public.clients
  for insert to authenticated
  with check (
    public.current_app_professional_id() is not null
    and created_by = auth.uid()
  );

create policy clients_professional_update
  on public.clients
  for update to authenticated
  using (
    public.current_app_professional_id() is not null
    and (
      created_by = auth.uid()
      or exists (
        select 1
        from public.appointments appointment
        where appointment.client_id = clients.id
          and appointment.professional_id = public.current_app_professional_id()
      )
    )
  )
  with check (
    public.current_app_professional_id() is not null
    and (
      created_by = auth.uid()
      or exists (
        select 1
        from public.appointments appointment
        where appointment.client_id = clients.id
          and appointment.professional_id = public.current_app_professional_id()
      )
    )
  );

-- Agenda: professional so pode consultar e alterar linhas da propria agenda.
create policy appointments_owner_manager_all
  on public.appointments
  for all to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy appointments_professional_select
  on public.appointments
  for select to authenticated
  using (professional_id = public.current_app_professional_id());

create policy appointments_professional_insert
  on public.appointments
  for insert to authenticated
  with check (professional_id = public.current_app_professional_id());

create policy appointments_professional_update
  on public.appointments
  for update to authenticated
  using (professional_id = public.current_app_professional_id())
  with check (professional_id = public.current_app_professional_id());

create policy appointments_professional_delete
  on public.appointments
  for delete to authenticated
  using (professional_id = public.current_app_professional_id());

-- Produtos: profissionais podem usar itens ativos na propria comanda, mas apenas
-- owner/manager altera cadastro e estoque.
create policy products_staff_select
  on public.products
  for select to authenticated
  using (
    public.is_app_owner_manager()
    or (public.current_app_professional_id() is not null and active = true)
  );

create policy products_owner_manager_insert
  on public.products
  for insert to authenticated
  with check (public.is_app_owner_manager());

create policy products_owner_manager_update
  on public.products
  for update to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy products_owner_manager_delete
  on public.products
  for delete to authenticated
  using (public.is_app_owner_manager());

-- Lista de espera: owner/manager administra tudo; professional apenas a propria.
create policy waitlist_owner_manager_all
  on public.waitlist_entries
  for all to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy waitlist_professional_select
  on public.waitlist_entries
  for select to authenticated
  using (professional_id = public.current_app_professional_id());

create policy waitlist_professional_insert
  on public.waitlist_entries
  for insert to authenticated
  with check (professional_id = public.current_app_professional_id());

create policy waitlist_professional_update
  on public.waitlist_entries
  for update to authenticated
  using (professional_id = public.current_app_professional_id())
  with check (professional_id = public.current_app_professional_id());

create policy waitlist_professional_delete
  on public.waitlist_entries
  for delete to authenticated
  using (professional_id = public.current_app_professional_id());

-- Solicitacoes publicas: anon pode criar somente pedidos ainda nao convertidos.
create policy booking_requests_public_insert
  on public.booking_requests
  for insert to anon
  with check (
    status = 'new'
    and appointment_id is null
  );

create policy booking_requests_owner_manager_all
  on public.booking_requests
  for all to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy booking_requests_professional_select
  on public.booking_requests
  for select to authenticated
  using (professional_id = public.current_app_professional_id());

create policy booking_requests_professional_update
  on public.booking_requests
  for update to authenticated
  using (professional_id = public.current_app_professional_id())
  with check (professional_id = public.current_app_professional_id());

-- Expediente e folgas: profissionais consultam apenas os proprios horarios;
-- alteracoes permanecem administrativas.
create policy working_hours_owner_manager_all
  on public.professional_working_hours
  for all to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy working_hours_professional_select
  on public.professional_working_hours
  for select to authenticated
  using (professional_id = public.current_app_professional_id());

create policy time_off_owner_manager_all
  on public.professional_time_off
  for all to authenticated
  using (public.is_app_owner_manager())
  with check (public.is_app_owner_manager());

create policy time_off_professional_select
  on public.professional_time_off
  for select to authenticated
  using (professional_id = public.current_app_professional_id());
