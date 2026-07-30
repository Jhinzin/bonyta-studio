-- Endurece o acesso por perfil no app interno.
-- Objetivo:
-- - owner/manager veem e gerenciam tudo.
-- - professional vê somente a própria agenda/clientes ligados à própria agenda.
-- - anon continua podendo ler apenas o catálogo público e usar o agendamento online.

-- Esta migration foi reservada durante a primeira implementação, mas não chegou
-- a conter SQL executável. O hardening idempotente foi entregue posteriormente em:
-- 202607290001_role_rls_hardening.sql

