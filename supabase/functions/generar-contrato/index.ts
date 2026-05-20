// Supabase Edge Function para generar contratos PDF
// Desplegar con: supabase functions deploy generar-contrato

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { titulo, precio, licencia, comprador } = await req.json()

    // Generate simple text contract (can be enhanced with PDF library)
    const contractText = generateContract({
      comprador: comprador || user.email,
      titulo: titulo || 'Beat',
      precio: precio || 0,
      licencia: licencia || 'Standard',
      fecha: new Date().toISOString().split('T')[0]
    })

    // Return as downloadable text file (or convert to PDF with additional libraries)
    return new Response(contractText, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="Contrato_${licencia}.txt"`
      }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateContract(data: {
  comprador: string
  titulo: string
  precio: number
  licencia: string
  fecha: string
}): string {
  const licenses: Record<string, string> = {
    'standard': `LICENCIA STANDARD
- Archivo MP3
- 10,000 reproducciones
- Uso no comercial permitido
- Sin derechos de radiodifusión`,
    'premium': `LICENCIA PREMIUM
- Archivos MP3 + WAV
- 500,000 reproducciones
- Uso comercial permitido
- Radio regional incluida`,
    'exclusive': `LICENCIA EXCLUSIVA
- Trackouts (Stems) incluidos
- Reproducciones ilimitadas
- Propiedad intelectual total
- Todos los derechos transferidos`
  }

  const licenseText = licenses[data.licencia.toLowerCase()] || licenses['standard']

  return `
═══════════════════════════════════════════════════════════════
                    CONTRATO DE LICENCIA
                      KAIRO WAVE
═══════════════════════════════════════════════════════════════

Fecha: ${data.fecha}

COMPRADOR: ${data.comprador}
BEAT: ${data.titulo}
LICENCIA: ${data.licencia.toUpperCase()}
PRECIO: $${data.precio}

───────────────────────────────────────────────────────────────
${licenseText}
───────────────────────────────────────────────────────────────

TÉRMINOS Y CONDICIONES:

1. El comprador obtiene una licencia de uso no exclusiva para el beat.
2. Los derechos de autor originales permanecen con Kairo Wave.
3. Queda prohibida la reventa o distribución no autorizada.
4. El uso comercial está sujeto a los términos de la licencia adquirida.

Al realizar la compra, el comprador acepta estos términos.

═══════════════════════════════════════════════════════════════
                    KAIRO WAVE
              https://kairowave.com
═══════════════════════════════════════════════════════════════
`
}
