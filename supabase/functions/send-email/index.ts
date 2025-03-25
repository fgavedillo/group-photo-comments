// Importa el módulo Deno.serve
import { corsHeaders, handleCors } from './cors.ts';
import { logger } from './logger.ts';
import { validateEmailPayload } from './types.ts';
import { sendEmail } from './emailService.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = 're_M2FFkWg5_5fy9uyFfxrdb9ExipW7kDJe8'

// Función para enviar emails usando Gmail
export async function sendEmailWithGmail(emailData: any) {
  const requestId = emailData.requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  try {
    const result = await sendEmail({
      ...emailData,
      requestId
    });
    
    return {
      success: true,
      message: result.message || "Email enviado correctamente",
      requestId,
      ...result
    };
  } catch (error) {
    logger.error(`[${requestId}] Error en sendEmailWithGmail:`, error);
    const errorResponse = {
      success: false,
      message: 'Error al enviar el email',
      error: {
        code: 'EMAIL_SEND_ERROR',
        details: error.message,
        size: {
          html: emailData.html?.length || 0,
          attachments: emailData.attachments?.length || 0
        }
      }
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

// Handle incoming requests
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()

    // Validar datos requeridos
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error('Se requiere al menos un destinatario')
    }

    if (!subject) {
      throw new Error('Se requiere un asunto para el correo')
    }

    if (!html) {
      throw new Error('Se requiere contenido HTML para el correo')
    }

    // Enviar correo usando Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PRL Conecta <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al enviar el correo')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      },
    )
  }
})
