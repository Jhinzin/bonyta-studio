-- Funções administrativas para gerenciar acessos pelo app.
-- Use depois de criar o usuário em Authentication > Users.

drop function if exists public.list_app_user_profiles();

create or replace function public.list_app_user_profiles()
returns table (
  user_id uuid,
  email text,
  role text,
  professional_id uuid,
  professional_name text,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    coalesce(p.email, u.email)::text as email,
    p.role,
    p.professional_id,
    prof.name as professional_name,
    p.active,
    p.created_at,
    p.updated_at
  from public.app_user_profiles p
  join auth.users u on u.id = p.user_id
  left join public.professionals prof on prof.id = p.professional_id
  where exists (
    select 1
    from public.app_user_profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.active = true
      and current_profile.role in ('owner', 'manager')
  )
  order by p.role, coalesce(p.email, u.email);
$$;

drop function if exists public.upsert_app_user_profile_by_email(text, text, uuid, boolean);

create or replace function public.upsert_app_user_profile_by_email(
  p_email text,
  p_role text,
  p_professional_id uuid default null,
  p_active boolean default true
)
returns table (
  user_id uuid,
  email text,
  role text,
  professional_id uuid,
  active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  if not exists (
    select 1
    from public.app_user_profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.active = true
      and current_profile.role in ('owner', 'manager')
  ) then
    raise exception 'Você não tem permissão para alterar acessos.';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));

  if v_email = '' then
    raise exception 'Informe o e-mail do usuário.';
  end if;

  if p_role not in ('owner', 'manager', 'professional') then
    raise exception 'Perfil inválido.';
  end if;

  select u.id
    into v_user_id
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_user_id is null then
    raise exception 'Usuário não encontrado. Crie o login em Authentication > Users primeiro.';
  end if;

  if p_role = 'professional' and p_professional_id is null then
    raise exception 'Vincule uma profissional para o perfil professional.';
  end if;

  insert into public.app_user_profiles (
    user_id,
    email,
    role,
    professional_id,
    active,
    updated_at
  ) values (
    v_user_id,
    v_email,
    p_role,
    case when p_role = 'professional' then p_professional_id else null end,
    p_active,
    now()
  )
  on conflict (user_id) do update
    set email = excluded.email,
        role = excluded.role,
        professional_id = excluded.professional_id,
        active = excluded.active,
        updated_at = now();

  return query
  select
    profile.user_id,
    profile.email,
    profile.role,
    profile.professional_id,
    profile.active
  from public.app_user_profiles profile
  where profile.user_id = v_user_id;
end;
$$;

grant execute on function public.list_app_user_profiles() to authenticated;
grant execute on function public.upsert_app_user_profile_by_email(text, text, uuid, boolean) to authenticated;
