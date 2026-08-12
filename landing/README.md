# Bonyta Studio Landing

Landing pública separada do app interno da Bonyta Studio.

Ela pode ser publicada como um projeto separado na Vercel, mas usando o mesmo Supabase do app de agenda. Essa é a ponte entre os dois:

- a landing lê serviços e profissionais ativos;
- a landing consulta horários livres pela função `public_get_available_slots`;
- ao finalizar, cria cliente + agendamento + registro em `booking_requests`;
- depois abre o WhatsApp com a mensagem pronta para confirmação humana.

## Rodar local

```bash
npm install
npm run dev
```

## Variáveis

Copie `.env.example` para `.env.local` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_WHATSAPP_NUMBER=5511969708873
```

## Deploy grátis na Vercel

Crie um projeto Vercel separado apontando para a pasta `landing`.

Configuração sugerida:

- Framework: Vite
- Root Directory: `landing`
- Build Command: `npm run build`
- Output Directory: `dist`

No painel da Vercel, adicione as mesmas variáveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_NUMBER`

O app interno pode ser outro projeto Vercel apontando para a raiz do repositório. Os dois ficam separados, mas conectados pelo mesmo Supabase.

## Catálogo inicial

Se o Supabase ainda tiver poucos serviços cadastrados, rode também:

```sql
supabase/migrations/202607170004_seed_public_services.sql
```

Esse arquivo adiciona serviços iniciais de unhas, cílios, sobrancelhas e depilação sem duplicar nomes já existentes.
