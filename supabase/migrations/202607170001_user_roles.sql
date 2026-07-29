-- Perfis de acesso do app interno.
-- owner/manager: veem tudo.
-- professional: vê agenda própria e ganhos próprios, sem regras financeiras do estúdio.

create table if not exists public.app_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'professional'
    check (role in ('owner', 'manager', 'professional')),
  professional_id uuid references public.professionals(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_user_profiles enable row level security;

drop policy if exists app_user_profiles_own_select on public.app_user_profiles;
drop policy if exists app_user_profiles_owner_all on public.app_user_profiles;

create policy app_user_profiles_own_select on public.app_user_profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy app_user_profiles_owner_all on public.app_user_profiles
  for all to authenticated
  using (
    exists (
      select 1
      from public.app_user_profiles owner_profile
      where owner_profile.user_id = auth.uid()
        and owner_profile.active = true
        and owner_profile.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1
      from public.app_user_profiles owner_profile
      where owner_profile.user_id = auth.uid()
        and owner_profile.active = true
        and owner_profile.role in ('owner', 'manager')
    )
  );

grant select, insert, update, delete on public.app_user_profiles to authenticated;

insert into public.app_user_profiles (user_id, email, role, active)
select id, email, 'owner', true
from auth.users
where lower(email) in ('wandrellclima@gmail.com', 'bonytastudio@gmail.com')
on conflict (user_id) do update
  set role = excluded.role,
      email = excluded.email,
      active = true,
      updated_at = now();

drop function if exists public.get_current_app_profile();

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
set search_path = public
as $$
  select
    u.id as user_id,
    u.email::text as email,
    coalesce(p.role, case
      when lower(u.email) in ('wandrellclima@gmail.com', 'bonytastudio@gmail.com') then 'owner'
      else 'professional'
    end) as role,
    p.professional_id,
    coalesce(p.active, true) as active
  from auth.users u
  left join public.app_user_profiles p on p.user_id = u.id
  where u.id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_current_app_profile() to authenticated;
