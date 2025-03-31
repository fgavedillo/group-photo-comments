
// Importa el módulo Deno.serve
import { corsHeaders } from './cors.ts';
import { logger } from './logger.ts';
import { Resend } from "npm:resend@2.0.0";

// Define una constante para el remitente de correo con el dominio verificado
const FROM_EMAIL = 'Sistema de Gestión <info@prlconecta.es>';

// Usa la API key desde las variables de entorno
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const resend = new Resend(RESEND_API_KEY);

// Handle incoming requests
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logger.info("Recibida solicitud para enviar correo con Resend");
    logger.info(`Usando remitente: ${FROM_EMAIL}`);
    
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
    
    const { to, subject, html, requestId } = body;
    const uniqueId = requestId || `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
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
    logger.info(`Usando correo FROM: ${FROM_EMAIL}`);

    // Log request headers for debugging
    const headersObj = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    logger.info("Headers de solicitud:", headersObj);

    // Preparar opciones de correo con todas las configuraciones necesarias
    const emailOptions = {
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
      headers: {
        "X-Entity-Ref-ID": uniqueId
      },
      tags: [
        { name: "source", value: "prlconecta" },
        { name: "category", value: "transactional" },
        { name: "mode", value: "production" }
      ]
    };

    logger.info("Configuración de email completa:", JSON.stringify(emailOptions, null, 2));

    // Enviar correo usando Resend con configuración explícita
    const emailResponse = await resend.emails.send(emailOptions);

    logger.info("Respuesta de Resend:", emailResponse);
    logger.info("Respuesta completa:", JSON.stringify(emailResponse));

    if (emailResponse.error) {
      logger.error("Error en Resend:", emailResponse.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResponse.error.message || 'Error al enviar el correo',
          details: emailResponse.error
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

    // Verificar si el remitente usado fue diferente al solicitado
    if (emailResponse.from && emailResponse.from !== FROM_EMAIL) {
      logger.warn(`ADVERTENCIA: Resend usó un remitente diferente: ${emailResponse.from}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: emailResponse,
        fromEmail: FROM_EMAIL, // Para debugging
        actualFromEmail: emailResponse.from // Para verificación
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
    logger.error("Error detallado:", JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido',
        details: JSON.stringify(error)
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
