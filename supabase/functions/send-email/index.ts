
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { logger } from "./logger.ts";
import { sendEmail } from "./emailService.ts";
import { corsHeaders } from "./cors.ts";
import { SendEmailRequest } from "./types.ts";

// Create the request handler
const handler = async (req: Request): Promise<Response> => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const body = await req.json();
    const { to, subject, html, cc, text, attachments, requestId = `req-${Date.now()}` } = body;
    
    // Validate required fields
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
    
    // Add CC processing
    const emailRequest: SendEmailRequest = {
      to,
      subject,
      requestId
    };
    
    // Add HTML or text content
    if (html) emailRequest.html = html;
    if (text) emailRequest.text = text;
    
    // Add CC if provided
    if (cc) emailRequest.cc = Array.isArray(cc) ? cc : [cc];
    
    // Add attachments if provided
    if (attachments) emailRequest.attachments = attachments;
    
    // Send the email
    const result = await sendEmail(emailRequest);
    
    // Return success
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    logger.error("Error en función send-email:", error);
    
    // Return error
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

// Start the server
serve(handler);
