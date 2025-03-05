
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { logger } from "./logger.ts";
import { sendEmail } from "./emailService.ts";
import { corsHeaders } from "./cors.ts";
import { SendEmailRequest } from "./types.ts";

// Crear el manejador de solicitudes
const handler = async (req: Request): Promise<Response> => {
  // Manejar solicitud preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      } 
    });
  }

  try {
    // Analizar el cuerpo de la solicitud
    const body = await req.json();
    const { to, subject, html, cc, text, attachments, requestId = `req-${Date.now()}` } = body;
    
    // Validar campos requeridos
    if (!to) {
      throw new Error("Campo 'to' es obligatorio");
    }
    
    if (!subject) {
      throw new Error("Campo 'subject' es obligatorio");
    }
    
    if (!html && !text) {
      throw new Error("Debe proporcionar 'html' o 'text' para el contenido del correo");
    }
    
    logger.log(`[${requestId}] Solicitud de envío de correo recibida: ${to}, Asunto: ${subject}`);
    
    // Procesamiento de CC
    const emailRequest: SendEmailRequest = {
      to,
      subject,
      requestId
    };
    
    // Agregar contenido HTML o texto
    if (html) emailRequest.html = html;
    if (text) emailRequest.text = text;
    
    // Agregar CC si se proporciona
    if (cc) emailRequest.cc = Array.isArray(cc) ? cc : [cc];
    
    // Agregar archivos adjuntos si se proporcionan
    if (attachments) emailRequest.attachments = attachments;
    
    // Enviar el correo
    const result = await sendEmail(emailRequest);
    
    // Devolver éxito
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    logger.error("Error en función send-email:", error);
    
    // Devolver error
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || "Error enviando correo electrónico",
          code: "EMAIL_ERROR"
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
