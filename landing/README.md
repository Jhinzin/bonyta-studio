# Bonyta Studio Landing

Landing pública separada do app interno.

## Rodar local

```bash
npm install
npm run dev
```

## Variáveis

Copie `.env.example` para `.env.local` e preencha:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_NUMBER`

## Deploy na Vercel

Crie um projeto separado apontando para a pasta `landing`.

O app interno pode ser outro projeto Vercel apontando para a raiz do repositório.
