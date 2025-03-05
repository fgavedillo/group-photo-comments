
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { logger } from "./logger.ts";
import { sendEmail } from "./emailService.ts";
import { corsHeaders } from "./cors.ts";
import { SendEmailRequest } from "./types.ts";

// Crear el manejador de solicitudes
const handler = async (req: Request): Promise<Response> => {
  // Generar un ID único para esta solicitud
  const uniqueRequestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  logger.log(`[${uniqueRequestId}] Email function invoked`);
  
  // Manejar solicitud OPTIONS de preflight
  if (req.method === "OPTIONS") {
    logger.log(`[${uniqueRequestId}] Responding to OPTIONS request (CORS preflight)`);
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      } 
    });
  }

  try {
    // Registrar encabezados para depuración
    const headersObj = Object.fromEntries(req.headers.entries());
    logger.log(`[${uniqueRequestId}] Headers received:`, JSON.stringify(headersObj));

    // Analizar el cuerpo de la solicitud
    const body = await req.json();
    const { to, subject, html, cc, text, attachments, requestId = uniqueRequestId } = body;
    
    logger.log(`[${requestId}] Request data received:`, JSON.stringify({
      to,
      subject,
      hasHtml: !!html,
      htmlLength: html ? html.length : 0,
      hasText: !!text,
      hasCc: !!cc,
      hasAttachments: !!attachments,
      attachmentsCount: attachments ? attachments.length : 0
    }));
    
    // Validar campos requeridos
    if (!to) {
      logger.error(`[${requestId}] 'to' field is required`);
      throw new Error("Campo 'to' es obligatorio");
    }
    
    if (!subject) {
      logger.error(`[${requestId}] 'subject' field is required`);
      throw new Error("Campo 'subject' es obligatorio");
    }
    
    if (!html && !text) {
      logger.error(`[${requestId}] Must provide 'html' or 'text' for email content`);
      throw new Error("Debe proporcionar 'html' o 'text' para el contenido del correo");
    }
    
    logger.log(`[${requestId}] Email request validated: ${to}, Subject: ${subject}`);
    
    // Crear el objeto de solicitud
    const emailRequest: SendEmailRequest = {
      to,
      subject,
      requestId
    };
    
    // Añadir contenido HTML o texto
    if (html) emailRequest.html = html;
    if (text) emailRequest.text = text;
    
    // Añadir CC si se proporciona
    if (cc) emailRequest.cc = Array.isArray(cc) ? cc : [cc];
    
    // Añadir archivos adjuntos si se proporcionan
    if (attachments) emailRequest.attachments = attachments;
    
    // Enviar el correo con medición de tiempo
    const startTime = Date.now();
    logger.log(`[${requestId}] Starting email send through service...`);
    
    const result = await sendEmail(emailRequest);
    
    const endTime = Date.now();
    logger.log(`[${requestId}] send-email function call completed in ${endTime - startTime}ms`);
    
    // Devolver éxito
    return new Response(JSON.stringify({
      ...result,
      processingTime: `${endTime - startTime}ms`,
      requestId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    logger.error(`[${uniqueRequestId}] Error in send-email function:`, error);
    
    // Devolver error con detalles para diagnóstico
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Error sending email",
          code: "EMAIL_ERROR",
          details: error.stack || "No additional details available",
          requestId: uniqueRequestId
        }
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};

// Iniciar el servidor
serve(handler);
