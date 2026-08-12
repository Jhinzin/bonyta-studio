# Plano de produto — Bonyta Studio

Atualizado em 21/07/2026.

## O que já está no núcleo do app

- Agenda com visão de dia, semana e mês.
- Profissionais, serviços, clientes e ficha com anamnese/alertas.
- Solicitações vindas da landing page com horário real consultado no Supabase.
- Cálculo de sinal sugerido de 30% para confirmação.
- Central de operação do dia e dos próximos 7 dias.
- Financeiro com visão geral e visão simplificada para profissional.
- Ticket médio separado por categoria/profissional: cílios, unhas, sobrancelhas e outros.
- Controle de acesso por perfil: administradora vê tudo; profissional vê apenas o necessário.
- Expediente da equipe e base para bloqueios/folgas.
- Botão `+` em menu escondido, com ações agrupadas por Agenda, Operação e Gestão.
- Landing page em pasta separada (`landing/`) pronta para deploy independente na Vercel.

## Referências de mercado observadas

- Trinks: perfis de acesso por profissional, agenda, fechamento de conta, comanda, comissão, integrações e rodízio de profissionais.
- Avec: agenda, financeiro, pagamentos, estoque/equipe, relatórios e IA.
- Fresha: agendamento online 24/7, pagamento antecipado/sinal, avaliações, fidelidade, campanhas, Google/Instagram e relatórios.
- Booksy: página pública com serviços, disponibilidade, portfólio, avaliações, agendamento 24/7, gestão de clientes, pagamentos e relatórios.

## Próximas etapas recomendadas

### Etapa 2 — Fechar operação diária sem custo mensal

1. Criar histórico da cliente por atendimento:
   - serviços feitos;
   - profissional;
   - valor;
   - observações;
   - alertas importantes;
   - retorno sugerido.

2. Criar central inteligente de mensagens sem mensalidade:
   - lembrete de confirmação;
   - lembrete de manutenção de cílios/unha/sobrancelha;
   - alerta de cliente há mais de 30 dias sem retornar;
   - pós-atendimento pedindo avaliação;
   - abertura do WhatsApp com mensagem pronta e envio confirmado por uma pessoa.

3. Registrar logs de mensagens:
   - mensagem preparada;
   - mensagem enviada manualmente pelo WhatsApp;
   - data e responsável.

4. Melhorar bloqueios/folgas:
   - tela simples para férias, pausa, almoço, mentoria e indisponibilidade;
   - bloquear esses horários também na landing.

### Etapa 3 — Melhorar conversão da landing

1. Página de serviço com fotos, preço e botão “quero esse”.
2. Agendamento público com:
   - seleção de serviço;
   - calendário;
   - horários disponíveis reais;
   - formulário da cliente;
   - aviso de sinal de 30%.
3. Página final com:
   - resumo do pedido;
   - botão WhatsApp;
   - instrução de Pix/sinal manual.
4. Eventos simples para tráfego:
   - clique em serviço;
   - início de agendamento;
   - envio de agendamento.

### Etapa 4 — Diferenciais para quando o básico estiver redondo

- Lista de espera inteligente.
- Pacotes e créditos da cliente.
- Programa de indicação/fidelidade.
- Avaliações/NPS.
- Galeria antes/depois por cliente.
- Relatório de origem: Instagram, indicação, landing, retorno.
- Rotina de reativação de clientes sumidas.

## Arquitetura de comunicação decidida

1. Agora, custo zero:
   - o app calcula automaticamente as mensagens pendentes;
   - confirmações entram na fila enquanto o agendamento estiver pendente;
   - lembretes entram na fila 24 horas antes;
   - manutenção entra em 20 dias para cílios, 21 para unhas e 30 para sobrancelhas;
   - reativação entra quando a cliente completa 30 dias sem novo atendimento;
   - a equipe clica e abre o WhatsApp com o texto pronto.

2. Próxima camada gratuita opcional:
   - Bonyta Assistant no Telegram para avisar a dona e as profissionais;
   - bot mostra cliente, motivo e botão para abrir a conversa no WhatsApp;
   - novo agendamento aparece no Telegram em até cinco minutos;
   - domingo depois das 18h envia a agenda de terça a sábado e o radar de retenção;
   - botão “cliente contatada” conclui a tarefa e registra no histórico do app;
   - Supabase continua sendo a fonte da agenda e dos prazos.
   - primeira ativação usa o Telegram privado da dona; distribuição por profissional será individual para não expor clientes de outra agenda.

3. Envio 100% automático no WhatsApp:
   - usar somente a API oficial da Meta;
   - confirmações e lembretes usam modelos de utilidade;
   - manutenção e reativação exigem consentimento e podem ser classificadas como marketing;
   - a landing já coleta consentimento operacional obrigatório e marketing opcional separadamente;
   - ativar quando o pequeno custo por mensagem couber no caixa.

## O que deixar para depois porque pode gerar custo

- WhatsApp API automático.
- Pagamento online automático.
- Google Calendar bidirecional.
- IA respondendo cliente.
- Campanhas automáticas com disparo em massa.

Enquanto a meta for custo zero, o melhor caminho é usar Supabase free + Vercel free + WhatsApp manual com links prontos.
