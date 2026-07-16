-- Campos de pagamento para fechamento de comanda.

alter table public.appointments
  add column if not exists amount_paid numeric(10,2) not null default 0,
  add column if not exists payment_method text not null default 'nao_informado',
  add column if not exists payment_status text not null default 'aberto';

alter table public.appointments
  drop constraint if exists appointments_payment_status_check,
  add constraint appointments_payment_status_check
    check (payment_status in ('aberto', 'sinal', 'pago'));

alter table public.appointments
  drop constraint if exists appointments_payment_method_check,
  add constraint appointments_payment_method_check
    check (payment_method in ('nao_informado', 'pix', 'credito', 'debito', 'dinheiro', 'transferencia', 'outro'));
