# 🌸 Guia Rápido de Operação — Bonyta Studio

Este é o manual de operação diário para a equipe do estúdio de beleza.

---

## 📱 1. Instalar o App no Celular (PWA)

1. Abra o navegador do celular (Safari no iPhone ou Chrome no Android).
2. Acesse a URL do sistema (ex: `https://bonyta-studio.vercel.app` ou seu servidor).
3. No iPhone: clique no botão de **Compartilhar** ➔ **Adicionar à Tela de Início**.
4. No Android: clique nos **três pontinhos** ➔ **Instalar aplicativo** ou **Adicionar à tela inicial**.
5. Pronto! O Bonyta Studio funcionará como um app nativo no celular.

---

## 🗓️ 2. Rotina Diária na Agenda

- **Ver o dia**: Selecione a aba **Agenda** para ver a linha do tempo com os agendamentos das profissionais.
- **Filtrar por profissional**: Use o seletor no topo para ver apenas a sua agenda ou a de toda a equipe.
- **Criar Agendamento**: Clique no botão **`+`** rosa no canto inferior direito ➔ escolha cliente, serviço, profissional e horário.
- **Concluir / Editar**: Clique sobre o card do agendamento para alterar o status (Confirmado, Concluído, Cancelado) ou registrar o valor cobrado.

---

## 💬 3. Central de Mensagens e WhatsApp

- **Notificações**: No topo da tela, o ícone de balão de mensagem mostra quantas confirmações, lembretes de 24h e manutenções estão pendentes.
- **Envio com 1 clique**: Ao abrir a central de comunicação, clique em **"Enviar WhatsApp"** para abrir o WhatsApp com o texto formatado para a cliente.
- **Automatização via Evolution API / n8n**: Se a Evolution API estiver ativa no servidor, o sistema pode enviar mensagens automáticas sem precisar clicar.

---

## 🔗 4. Link Público de Agendamento (`/agendar`)

- Suas clientes podem consultar o catálogo de serviços e solicitar horários diretamente pelo link: `https://seusite.com/agendar`.
- O app verifica os horários livres em tempo real para evitar choques de agenda.
- Cada nova solicitação gera uma notificação no app e no robô do Telegram para aprovação rápida.
