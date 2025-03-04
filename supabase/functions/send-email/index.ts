
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
    
    if (!gmailUser || !gmailPass) {
      logger.error("Gmail credentials missing");
      throw new Error(
        "Email configuration error: Gmail credentials missing. " +
        "Please set GMAIL_USER and GMAIL_APP_PASSWORD in Supabase Edge Function secrets."
      );
    }

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    logger.info(`Received email request for ${recipients.join(', ')}`);
    
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
    
    // Format user-friendly error message
    let userMessage = "Email sending failed";
    let detailedError = error.message;
    let howToFix = "Please check the logs for more details.";
    
    if (error.message && error.message.includes("Gmail authentication failed")) {
      userMessage = "Autenticación de Gmail fallida";
      detailedError = error.message;
      howToFix = `
Para solucionar este problema:
1. Verifique que el nombre de usuario de Gmail es correcto (prevencionlingotes@gmail.com)
2. Asegúrese de tener habilitada la verificación en dos pasos: https://myaccount.google.com/security
3. Cree una contraseña de aplicación específica: https://myaccount.google.com/apppasswords
4. Use la contraseña de aplicación SIN ESPACIOS en la configuración (debe tener 16 caracteres)
5. Actualice las variables de entorno en Supabase Edge Functions
`;
    } else if (error.message && error.message.includes("Email configuration error")) {
      userMessage = "Error de configuración";
      detailedError = error.message;
      howToFix = "Configure las variables GMAIL_USER y GMAIL_APP_PASSWORD en los secretos de Supabase Edge Functions.";
    }
    
    // Return detailed error response
    const errorResponse: EmailResponse = {
      success: false,
      message: userMessage,
      requestId: requestId,
      elapsedTime: `${elapsedTime}ms`,
      error: {
        message: detailedError,
        stack: error.stack,
        details: howToFix
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
