# Bonyta Studio - Agenda

## Versão sem mensalidade

Esta versão foi organizada para funcionar com serviços gratuitos enquanto o volume do estúdio couber nos limites deles:

- React + Vite para o site e painel.
- Supabase Free para banco, autenticação e tempo real.
- Vercel Hobby ou Netlify Free para hospedagem.
- WhatsApp por link com mensagem preenchida, sem plataforma de bot.

Rotas:

- `/`: app de agenda da equipe, protegido por e-mail e senha.
- `/app`: atalho alternativo para o mesmo app interno.
- `/agendar`: landing pública com catálogo e solicitação pelo WhatsApp.

### Ativar a base segura

1. No Supabase, abra `Authentication > Users` e crie ou convide o primeiro usuário da equipe.
2. No SQL Editor, execute `supabase/migrations/202607120001_free_foundation.sql`.
3. Em `Authentication > Providers > Email`, desative novos cadastros públicos depois de criar a equipe.
4. Defina `VITE_WHATSAPP_NUMBER` no `.env` com DDI + DDD + número, somente dígitos. Exemplo: `5511999999999`.

Sem essa variável, o botão da landing ainda abre o compartilhamento do WhatsApp, mas a cliente precisa escolher o contato do estúdio.

App de agenda mobile-first para o studio de beleza, agora em **React + Vite** com
**Supabase** como banco de dados (em vez dos dados fixos no `app.js` original).

## O que mudou em relação à versão anterior

- Os agendamentos agora ficam salvos no Supabase (não somem ao recarregar a página).
- Dá para **editar e excluir** um agendamento clicando no card (antes só dava pra criar).
- **Tempo real**: se duas pessoas usarem o app em celulares diferentes ao mesmo tempo,
  a agenda atualiza sozinha pros dois.
- Mesmo visual (tema escuro/claro, cards coloridos por profissional, etc.) - só a
  estrutura do código que mudou pra React + componentes.

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e crie um novo projeto.
2. No painel, vá em **SQL Editor** → cole o conteúdo do arquivo `supabase/schema.sql`
   → clique em **Run**. Isso cria as tabelas `professionals` e `appointments`, as
   permissões de acesso, e já cadastra Bea, Carol e Maira S.
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**

## 2. Configurar o projeto localmente

```bash
cd bonyta-studio
cp .env.example .env
```

Abra o `.env` e cole a URL e a anon key que você copiou:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

Instale as dependências e rode o app:

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

## 3. Publicar o app (deixar acessível pelo celular de qualquer lugar)

A opção mais simples é a [Vercel](https://vercel.com) ou a [Netlify](https://netlify.com):

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel/Netlify, importe o repositório.
3. Nas variáveis de ambiente do projeto (não no código), adicione
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores do `.env`.
4. Faça o deploy. Você recebe uma URL pra acessar do celular (pode até adicionar
   à tela inicial do celular como um "app").

## Estrutura do projeto

```
src/
├── App.jsx                 # Estado principal (data, view, filtro, modal)
├── index.css                # Visual (mesmo CSS do app original)
├── supabaseClient.js        # Conexão com o Supabase
├── utils.js                  # Funções de data e constantes
├── hooks/
│   └── useAppointments.js   # Busca, cria, edita, exclui e escuta tempo real
└── components/
    ├── Header.jsx
    ├── WeekDaysStrip.jsx
    ├── DayView.jsx           # Visão "Dia" (timeline)
    ├── WeekView.jsx          # Visão "Semana" (cards)
    ├── MonthView.jsx         # Visão "Mês" (grade)
    ├── BottomNav.jsx
    └── AppointmentModal.jsx  # Criar / editar / excluir agendamento
```

## Próximas ideias (não incluídas nesta versão)

- Status do agendamento (confirmado / concluído / faltou / cancelado).
- Link de WhatsApp para confirmar horário com a cliente.
- Bloqueio de horários (almoço, folga das profissionais).
- Relatório de faturamento mensal por profissional.
- Login por profissional (autenticação via Supabase Auth).
- Página pública para a cliente marcar horário sozinha.

Se quiser, posso implementar qualquer uma dessas na sequência.
