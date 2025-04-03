
// Importa el módulo Deno.serve
import { corsHeaders } from './cors.ts';
import { logger } from './logger.ts';
import { Resend } from "npm:resend@2.0.0";

// Usa la API key desde las variables de entorno
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || 're_2TqHgv5B_62eNDe38YRyhnXfzSjmp2ShP';

const resend = new Resend(RESEND_API_KEY);

// Handle incoming requests
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logger.info("Recibida solicitud para enviar correo con Resend");
    
    // Parsear cuerpo de la solicitud
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON body"
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        },
      );
    }
    
    const { to, subject, html } = body;
    
    // Validar datos requeridos
    if (!to || !Array.isArray(to) || to.length === 0) {
      logger.error("Error: Se requiere al menos un destinatario");
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Se requiere al menos un destinatario'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        },
      );
    }

    if (!subject) {
      logger.error("Error: Se requiere un asunto para el correo");
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Se requiere un asunto para el correo'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        },
      );
    }

    if (!html) {
      logger.error("Error: Se requiere contenido HTML para el correo");
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Se requiere contenido HTML para el correo'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        },
      );
    }

    const recipientsStr = to.join(', ');
    logger.info(`Enviando correo a: ${recipientsStr}`);

    // Enviar correo usando Resend
    const emailResponse = await resend.emails.send({
      from: 'PRL Conecta <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: html,
    });

    logger.info("Respuesta de Resend:", emailResponse);

    if (emailResponse.error) {
      logger.error("Error en Resend:", emailResponse.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResponse.error.message || 'Error al enviar el correo'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: emailResponse
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
    logger.error("Error en send-email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    );
  }
});
