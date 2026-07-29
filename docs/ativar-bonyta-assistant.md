# Ativar o Bonyta Assistant no Telegram

O Bonyta Assistant é um bot operacional gratuito. Ele não envia mensagens pelo WhatsApp sozinho: organiza a tarefa, avisa a equipe, abre a conversa com o texto pronto e registra quando a cliente foi contatada.

## Fluxos preparados

- Novo agendamento: chega no Telegram em até cinco minutos.
- Confirmação: botão abre a cliente no WhatsApp com a mensagem pronta.
- Lembrete: entra na fila 24 horas antes do atendimento.
- Manutenção: 20 dias para cílios, 21 para unhas e 30 para sobrancelhas/outros retornos.
- Relatório semanal: domingo, depois das 18h, com a agenda de terça a sábado.
- Radar de retenção: manutenções previstas para a semana.
- Botão “Marcar como contatada”: conclui a tarefa e registra no histórico do app.

## 1. Banco de dados

Execute no SQL Editor, nesta ordem:

1. `202607170005_message_logs.sql`, se ainda não foi executado.
2. `202607210001_whatsapp_consents.sql`.
3. `202607210002_bonyta_telegram_assistant.sql`.

Não adicione `create extension pgcrypto` antes desses arquivos.

## 2. Criar o bot

1. Abra o Telegram e converse com o perfil oficial `@BotFather`.
2. Envie `/newbot`.
3. Nome sugerido: `Bonyta Studio Assistant`.
4. Usuário sugerido: `bonytastudio_assistant_bot` ou outro disponível.
5. Guarde o token criado pelo BotFather. Não coloque o token no código, no GitHub ou na landing.
6. Abra o novo bot e envie `/start`.

Para a primeira versão, use a conversa privada da dona do estúdio como `TELEGRAM_CHAT_ID`. Não coloque todas as profissionais em um grupo único, porque o relatório contém nomes, telefones e serviços de clientes de profissionais diferentes. O app continua mostrando para cada profissional somente a própria agenda.

## 3. Segredos da função

No Supabase, abra as configurações de segredos das Edge Functions e cadastre:

- `TELEGRAM_BOT_TOKEN`: token entregue pelo BotFather.
- `TELEGRAM_CHAT_ID`: identificador da conversa que receberá os avisos.
- `TELEGRAM_WEBHOOK_SECRET`: senha aleatória usada para validar que a chamada veio do Telegram.
- `ASSISTANT_CRON_SECRET`: outra senha aleatória usada pelo agendador.

As duas senhas aleatórias devem ser diferentes. Não salve esses valores em arquivos do projeto.

## 4. Publicar a função

Publique a função localizada em:

`supabase/functions/bonyta-assistant/index.ts`

Ela deve ficar disponível em:

`https://SEU-PROJETO.supabase.co/functions/v1/bonyta-assistant`

A validação JWT dessa função fica desabilitada porque o Telegram precisa chamá-la. A própria função protege cada entrada com os dois segredos configurados acima.

## 5. Ligar o Telegram à função

Registre a URL da função como webhook do bot e passe o mesmo `TELEGRAM_WEBHOOK_SECRET` como `secret_token`.

Depois disso, ao enviar `/start`, o bot deve responder que o Bonyta Assistant está ativo.

## 6. Criar o agendamento automático

No Supabase, abra `Integrations` → `Cron` e crie um trabalho HTTP:

- Nome: `bonyta-assistant-dispatch`.
- Frequência: `*/5 * * * *`.
- Método: `POST`.
- URL: URL pública da função.
- Cabeçalho `Content-Type`: `application/json`.
- Cabeçalho `x-assistant-secret`: o valor de `ASSISTANT_CRON_SECRET`.
- Corpo: `{"action":"dispatch"}`.

O trabalho a cada cinco minutos cuida de todos os fluxos. Não é necessário criar outro trabalho específico para domingo: a própria função detecta o domingo, cria o relatório depois das 18h e usa somente terça a sábado.

## Segurança

- Nunca compartilhar o token do Telegram em conversa, print ou repositório.
- Somente o `TELEGRAM_CHAT_ID` configurado pode usar os botões do assistente.
- A primeira versão envia o relatório completo somente para a dona; avisos individuais por profissional podem ser adicionados depois com um chat separado para cada uma.
- Se um token aparecer publicamente, revogue no BotFather e gere outro.
- O número do WhatsApp permanece no aplicativo oficial; o Telegram apenas abre links `wa.me`.
