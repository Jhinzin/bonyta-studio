-- ============================================================
-- Bonyta Studio: Função para registro de profissional no signup
-- A profissional se cadastra pelo app e já entra ativa.
-- ============================================================

create or replace function public.register_professional_account(
  p_name       text,
  p_phone      text default null,
  p_color      text default 'pink'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id    uuid;
  v_prof_id    uuid;
  v_email      text;
  v_valid_color text;
begin
  -- Usuário autenticado atual
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuário não autenticado.');
  end if;

  select email into v_email from auth.users where id = v_user_id;

  -- Normaliza a cor para os valores aceitos
  v_valid_color := case
    when p_color in ('pink', 'dark-pink', 'black-theme', 'purple', 'blue', 'green', 'orange', 'teal') then p_color
    else 'pink'
  end;

  -- Se já existe perfil ativo, não recria
  if exists (
    select 1 from public.app_user_profiles
    where user_id = v_user_id and active = true
  ) then
    return jsonb_build_object('success', false, 'error', 'Você já possui um perfil ativo no app.');
  end if;

  -- Cria (ou reutiliza) a profissional na tabela professionals
  insert into public.professionals (name, style_class, active, specialty)
  values (trim(p_name), v_valid_color, true, null)
  returning id into v_prof_id;

  -- Cria o perfil de acesso vinculado à profissional
  insert into public.app_user_profiles (user_id, email, role, professional_id, active)
  values (v_user_id, v_email, 'professional', v_prof_id, true)
  on conflict (user_id) do update
    set email          = excluded.email,
        role           = 'professional',
        professional_id = excluded.professional_id,
        active         = true,
        updated_at     = now();

  return jsonb_build_object(
    'success', true,
    'professional_id', v_prof_id,
    'name', trim(p_name)
  );
end;
$$;

revoke all on function public.register_professional_account(text, text, text) from public;
grant execute on function public.register_professional_account(text, text, text) to authenticated;
