# Supabase CLI Setup & Deployment Guide

## Prerequisites

1. Install Supabase CLI:
   ```bash
   # Windows (via scoop)
   scoop install supabase

   # Or via npm
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref pownnyycfgfkstuvpdaw
   ```

## Deploy Edge Function

Deploy the contract generation function:

```bash
supabase functions deploy generar-contrato
```

## Environment Variables

Set these in your Supabase project (Dashboard → Settings → Edge Functions):

- `SUPABASE_URL`: https://pownnyycfgfkstuvpdaw.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: (Get from Dashboard → Settings → API)

## Test the Function

```bash
# Test locally
supabase functions serve generar-contrato

# Deploy
supabase functions deploy generar-contrato
```

## Notes

- The Edge Function generates a text contract (can be converted to PDF with additional libraries like `pdfmake`)
- Authentication is handled via Bearer token in the Authorization header
- The function stores purchases in the `ventas` table
