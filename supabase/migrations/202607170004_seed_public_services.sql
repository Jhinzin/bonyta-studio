-- Catálogo inicial de serviços para aparecer na landing pública.
-- Baseado no catálogo By Maira Stoche 10/2025 e nas tabelas de cílios/sobrancelhas enviadas.
-- Pode rodar mais de uma vez: atualiza serviços existentes pelo nome e cria os que faltarem.

with seed(name, duration_minutes, price, material_cost) as (
  values
    -- Unhas - Catálogo By Maira Stoche 10/2025
    ('Alongamento em Fibra de Vidro - Aplicação', 150, 170.00, 0.00),
    ('Alongamento em Fibra de Vidro - Manutenção', 120, 130.00, 0.00),
    ('Alongamento Molde F1 - Aplicação', 150, 140.00, 0.00),
    ('Alongamento Molde F1 - Manutenção', 120, 100.00, 0.00),
    ('Banho de Gel', 90, 120.00, 0.00),
    ('Esmaltação em Gel', 60, 65.00, 0.00),
    ('Reconstrução', 120, 95.00, 0.00),
    ('Decoração Elaborada', 30, 35.00, 0.00),
    ('Kids Art', 60, 50.00, 0.00),
    ('Remoção para Nova Aplicação', 45, 30.00, 0.00),
    ('Remoção de Alongamento', 60, 50.00, 0.00),
    ('Postiça Personalizada', 60, 40.00, 0.00),

    -- Cílios - tabela visual enviada
    ('Cílios - Bonyta Classic - Aplicação', 120, 140.00, 0.00),
    ('Cílios - Bonyta Classic - Manutenção', 90, 125.00, 0.00),
    ('Cílios - Bonyta Pipoca - Aplicação', 120, 160.00, 0.00),
    ('Cílios - Bonyta Pipoca - Manutenção', 90, 140.00, 0.00),
    ('Cílios - Volume Brasileiro - Aplicação', 120, 140.00, 0.00),
    ('Cílios - Volume Brasileiro - Manutenção', 90, 125.00, 0.00),
    ('Cílios - Bonyta Sphinx - Aplicação', 120, 140.00, 0.00),
    ('Cílios - Bonyta Sphinx - Manutenção', 90, 130.00, 0.00),
    ('Cílios - Bonyta Catwalk - Aplicação', 120, 140.00, 0.00),
    ('Cílios - Bonyta Catwalk - Manutenção', 90, 120.00, 0.00),
    ('Cílios - Bonyta Fox - Aplicação', 120, 180.00, 0.00),
    ('Cílios - Bonyta Fox - Manutenção', 90, 160.00, 0.00),
    ('Cílios - Bonyta Bloom - Aplicação', 120, 150.00, 0.00),
    ('Cílios - Bonyta Bloom - Manutenção', 90, 130.00, 0.00),
    ('Cílios - Bonyta Amabbi - Aplicação', 120, 180.00, 0.00),
    ('Cílios - Bonyta Amabbi - Manutenção', 90, 160.00, 0.00),
    ('Cílios - Bonyta Lux - Aplicação', 120, 180.00, 0.00),
    ('Cílios - Bonyta Lux - Manutenção', 90, 160.00, 0.00),

    -- Sobrancelhas e depilação - tabela visual enviada
    ('Sobrancelha - Design Personalizado', 45, 40.00, 0.00),
    ('Sobrancelha - Design com Henna', 60, 55.00, 0.00),
    ('Sobrancelha - Brow Lamination', 90, 180.00, 0.00),
    ('Depilação - Buço na Cera', 15, 15.00, 0.00),
    ('Depilação - Buço na Linha', 15, 25.00, 0.00),
    ('Depilação - Rosto na Linha', 45, 60.00, 0.00),

    -- Ajuda para cliente indecisa
    ('Quero uma recomendação', 60, 0.00, 0.00)
),
updated as (
  update public.services existing
    set duration_minutes = seed.duration_minutes,
        price = seed.price,
        material_cost = seed.material_cost,
        active = true
  from seed
  where lower(existing.name) = lower(seed.name)
  returning existing.id
)
insert into public.services (name, duration_minutes, price, material_cost, active)
select seed.name, seed.duration_minutes, seed.price, seed.material_cost, true
from seed
where not exists (
  select 1
  from public.services existing
  where lower(existing.name) = lower(seed.name)
);

-- Se uma versão anterior deste seed já criou placeholders genéricos com preço 0,
-- eles ficam inativos para não duplicar a vitrine pública.
update public.services
  set active = false
where price = 0
  and lower(name) in (
    lower('Manutenção de Unhas'),
    lower('Alongamento em Gel'),
    lower('Bonyta Bloom'),
    lower('Cílios - Volume Brasileiro'),
    lower('Cílios - Fox'),
    lower('Cílios - Boneca'),
    lower('Cílios - Manutenção')
  );
