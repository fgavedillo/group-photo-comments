
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { EmailPayload, EmailResponse } from "./types.ts";
import { corsHeaders } from "./cors.ts";
import { Logger } from "./logger.ts";
import { sendEmailWithTimeout } from "./emailService.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Start timing and generate request ID if not provided
  const startTime = Date.now();
  let requestId: string;
  
  try {
    const payload = await req.json() as EmailPayload;
    requestId = payload.requestId || `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const logger = new Logger(requestId);
    logger.info("Email function invoked");
    
    // Validar los datos de la petición para logs completos
    logger.info(`Solicitud recibida: 
      - Destinatario: ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}
      - Asunto: ${payload.subject}
      - HTML: ${payload.html ? 'Incluido' : 'No incluido'} (${payload.html?.length || 0} caracteres)
      - Contenido texto: ${payload.content ? 'Incluido' : 'No incluido'} (${payload.content?.length || 0} caracteres)
      - Adjuntos: ${payload.attachments?.length || 0}
    `);
    
    // Validate required fields
    if (!payload.to || !payload.subject || (!payload.content && !payload.html)) {
      logger.error("Missing required fields in payload:", 
        JSON.stringify({
          hasTo: !!payload.to,
          hasSubject: !!payload.subject,
          hasContent: !!(payload.content || payload.html)
        })
      );
      throw new Error("Missing required fields: to, subject, and content or html");
    }

    // Check if GMAIL_USER and GMAIL_APP_PASSWORD environment variables are set
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    
    logger.info(`Verificando credenciales de Gmail:
      - GMAIL_USER: ${gmailUser ? 'Configurado' : 'NO CONFIGURADO'}
      - GMAIL_APP_PASSWORD: ${gmailPass ? 'Configurado' : 'NO CONFIGURADO'} (longitud: ${gmailPass?.length || 0})
    `);
    
    if (!gmailUser || !gmailPass) {
      logger.error("Gmail credentials missing");
      throw new Error(
        "Email configuration error: Gmail credentials missing. " +
        "Please set GMAIL_USER and GMAIL_APP_PASSWORD in Supabase Edge Function secrets."
      );
    }

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    logger.info(`Preparing to send email to ${recipients.join(', ')}`);
    
    // Send email with timeout handling
    await sendEmailWithTimeout(payload, logger);
    
    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;
    logger.info(`Email sent successfully to ${recipients.join(", ")} in ${elapsedTime}ms`);

    // Return success response
    const response: EmailResponse = {
      success: true, 
      message: "Email sent successfully",
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
    // Use default request ID if we couldn't parse one from the payload
    requestId = requestId || `error-${Date.now()}`;
    const logger = new Logger(requestId);
    
    // Calculate elapsed time for error case
    const elapsedTime = Date.now() - startTime;
    logger.error(`Error sending email (${elapsedTime}ms):`, error);
    
    // Format user-friendly error message with more detailed diagnostics
    let userMessage = "Email sending failed";
    let detailedError = error.message;
    let howToFix = "Por favor revisa los logs para más detalles.";
    let errorCode = "UNKNOWN_ERROR";
    
    if (error.message && error.message.includes("Gmail authentication failed")) {
      userMessage = "Autenticación de Gmail fallida";
      detailedError = error.message;
      errorCode = "AUTH_ERROR";
      howToFix = `
Para solucionar este problema:
1. Verifique que el nombre de usuario de Gmail es correcto (prevencionlingotes@gmail.com)
2. Asegúrese de tener habilitada la verificación en dos pasos: https://myaccount.google.com/security
3. Cree una contraseña de aplicación específica: https://myaccount.google.com/apppasswords
4. Use la contraseña de aplicación SIN ESPACIOS en la configuración (debe tener 16 caracteres)
5. Actualice las variables de entorno en Supabase Edge Functions

Guía paso a paso:
a) Ir a la cuenta de Google -> Seguridad
b) Verificación en dos pasos -> debe estar ACTIVADA
c) Contraseñas de aplicación -> Crear nueva para "Otra aplicación personalizada"
d) Copiar la contraseña generada SIN ESPACIOS
e) Actualizar el secreto GMAIL_APP_PASSWORD en Supabase
`;
    } else if (error.message && error.message.includes("Email configuration error")) {
      userMessage = "Error de configuración";
      detailedError = error.message;
      errorCode = "CONFIG_ERROR";
      howToFix = "Configure las variables GMAIL_USER y GMAIL_APP_PASSWORD en los secretos de Supabase Edge Functions.";
    } else if (error.message && error.message.includes("SMTP")) {
      userMessage = "Error de conexión SMTP";
      detailedError = error.message;
      errorCode = "SMTP_ERROR";
      howToFix = `
Problema con la conexión SMTP a Gmail:
1. Verifique que no hay restricciones de red que bloqueen la conexión SMTP
2. Asegúrese de que la cuenta de Gmail no tenga restricciones adicionales de seguridad
3. Confirme que la contraseña de aplicación es correcta y reciente
`;
    } else if (error.name === 'AbortError' || error.message?.includes('timed out')) {
      userMessage = "Tiempo de espera agotado";
      detailedError = "La operación de envío de correo excedió el tiempo máximo de espera";
      errorCode = "TIMEOUT_ERROR";
      howToFix = `
El envío de correo tomó demasiado tiempo:
1. Puede ser un problema temporal de conexión con Gmail
2. Intente nuevamente más tarde
3. Si el problema persiste, verifique la conexión a internet del servidor
`;
    }
    
    // Incluir información sobre el entorno para mejor diagnóstico
    const environmentInfo = `
Información del entorno:
- Deno version: ${Deno.version.deno}
- V8 version: ${Deno.version.v8}
- TypeScript version: ${Deno.version.typescript}
- Request ID: ${requestId}
- User Agent: ${logger.getRequestInfo()?.userAgent || 'No disponible'}
`;
    
    // Return detailed error response with improved diagnostic information
    const errorResponse: EmailResponse = {
      success: false,
      message: userMessage,
      requestId: requestId,
      elapsedTime: `${elapsedTime}ms`,
      error: {
        message: detailedError,
        code: errorCode,
        stack: error.stack,
        details: howToFix + "\n\n" + environmentInfo
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
