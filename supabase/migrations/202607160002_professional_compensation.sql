-- Regras financeiras por profissional.
-- Use para aluguel/custo fixo mensal ou porcentagem de repasse.

alter table public.professionals
  add column if not exists compensation_type text not null default 'studio',
  add column if not exists commission_percent numeric(5,2) not null default 0,
  add column if not exists monthly_rent_share numeric(10,2) not null default 0,
  add column if not exists compensation_notes text;

alter table public.professionals
  drop constraint if exists professionals_compensation_type_check,
  add constraint professionals_compensation_type_check
    check (compensation_type in ('studio', 'commission', 'rent_share'));

alter table public.professionals
  drop constraint if exists professionals_commission_percent_check,
  add constraint professionals_commission_percent_check
    check (commission_percent >= 0 and commission_percent <= 100);

alter table public.professionals
  drop constraint if exists professionals_monthly_rent_share_check,
  add constraint professionals_monthly_rent_share_check
    check (monthly_rent_share >= 0);
