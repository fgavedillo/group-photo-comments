
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { EmailPayload, EmailResponse } from "./types.ts";
import { corsHeaders } from "./cors.ts";
import { Logger } from "./logger.ts";
import { sendEmailWithTimeout } from "./emailService.ts";

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Iniciar temporización y generar ID de solicitud
  const startTime = Date.now();
  let requestId: string;
  
  try {
    const payload = await req.json() as EmailPayload;
    requestId = payload.requestId || `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const logger = new Logger(requestId);
    logger.info("Función de email invocada");
    
    // Validar campos requeridos
    if (!payload.to || !payload.subject || (!payload.content && !payload.html)) {
      logger.error("Faltan campos requeridos");
      throw new Error("Faltan campos requeridos: destinatario, asunto, y contenido o html");
    }

    // Verificar credenciales de Gmail
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!gmailUser || !gmailPass) {
      logger.error("Credenciales de Gmail no configuradas");
      throw new Error(
        "Error de configuración: Credenciales de Gmail no configuradas. " +
        "Configure GMAIL_USER y GMAIL_APP_PASSWORD en los secretos de la función Edge."
      );
    }

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    logger.info(`Preparando envío a ${recipients.join(', ')}`);
    
    // Enviar email
    await sendEmailWithTimeout(payload, logger);
    
    // Calcular tiempo transcurrido
    const elapsedTime = Date.now() - startTime;
    logger.info(`Email enviado correctamente en ${elapsedTime}ms`);

    // Devolver respuesta de éxito
    const response: EmailResponse = {
      success: true, 
      message: "Email enviado correctamente",
      recipients: recipients,
      requestId: requestId,
      elapsedTime: `${elapsedTime}ms`
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Usar ID de solicitud predeterminado si no pudimos analizarlo
    requestId = requestId || `error-${Date.now()}`;
    const logger = new Logger(requestId);
    
    // Calcular tiempo transcurrido para el caso de error
    const elapsedTime = Date.now() - startTime;
    logger.error(`Error al enviar email (${elapsedTime}ms):`, error);
    
    // Respuesta de error detallada
    const errorResponse: EmailResponse = {
      success: false,
      message: "Error al enviar email: " + (error.message || "Error desconocido"),
      requestId: requestId,
      elapsedTime: `${elapsedTime}ms`,
      error: {
        message: error.message || "Error desconocido",
        stack: error.stack,
      }
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
