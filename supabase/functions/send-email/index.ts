import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SendGridClient } from "https://deno.land/x/sendgrid@0.0.3/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content } = await req.json()
    
    const sendGrid = new SendGridClient(Deno.env.get('SENDGRID_API_KEY'))
    
    const msg = {
      to,
      from: 'noreply@yourdomain.com', // Actualiza esto con tu dominio verificado en SendGrid
      subject,
      text: content,
    }

    await sendGrid.send(msg)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      },
    )
  }
})