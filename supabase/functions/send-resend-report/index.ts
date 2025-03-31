
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { Resend } from "https://esm.sh/@resend/node@0.5.0";

// Initialize Resend with API key from environment
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = "PRL Conecta <notificaciones@prlconecta.es>"; // Using verified domain

if (!resendApiKey) {
  console.error("RESEND_API_KEY environment variable is not set");
  throw new Error("RESEND_API_KEY environment variable is not set");
}

const resend = new Resend(resendApiKey);

// Function to log information about request and configuration
const logInfo = (message: string, data?: any, requestId?: string) => {
  const timestamp = new Date().toISOString();
  const logPrefix = requestId ? `[${timestamp}] [${requestId}]` : `[${timestamp}]`;
  console.log(`${logPrefix} ${message}`, data || "");
};

console.log(`[${new Date().toISOString()}] Loading send-resend-report function`);

// Validate configuration
if (resendApiKey?.length >= 20) {
  console.log(`[${new Date().toISOString()}] Configuration validated successfully`);
  console.log(`[${new Date().toISOString()}] Using FROM address: ${fromEmail}`);
  console.log(`[${new Date().toISOString()}] API Key length: ${resendApiKey.length}`);
} else {
  console.error(`[${new Date().toISOString()}] Invalid RESEND_API_KEY configuration`);
}

// Helper functions for email content
function getStatusLabel(status: string): string {
  switch (status) {
    case "en-estudio": return "En Estudio";
    case "en-curso": return "En Curso";
    case "cerrada": return "Cerrada";
    case "denegado": return "Denegada";
    default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Sin Estado";
  }
}

serve(async (req) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  logInfo(`Received ${req.method} request from ${req.headers.get("origin") || "unknown origin"}`, null, requestId);
  
  // Handle CORS preflight requests first
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    logInfo("Request data:", JSON.stringify(requestData), requestId);
    
    // Extract email data
    const { to, subject, html, clientRequestId } = requestData;
    
    // Use client-provided request ID if available for easier tracking
    const logId = clientRequestId || requestId;
    
    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error("Recipients (to) are required and must be an array");
    }
    
    if (!subject) {
      throw new Error("Subject is required");
    }
    
    // Asegurar que siempre tenemos un HTML inicial para el correo
    if (!html || html.trim() === '') {
      throw new Error("HTML content is required");
    }
    
    // Prepare email data for Resend
    const emailData = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html
    };
    
    logInfo("Attempting to send email to:", to, requestId);
    console.log("Attempting to send email to (from console.log):", to);
    
    // Send email via Resend
    try {
      const result = await resend.emails.send(emailData);
      
      const elapsedTime = Date.now() - startTime;
      logInfo(`Email sent successfully via Resend in ${elapsedTime}ms:`, result, logId);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: { 
            message: "Email enviado correctamente con Resend",
            id: result.id,
            recipients: to,
            emailSent: true,
            requestId: logId,
            elapsedTime: `${elapsedTime}ms`,
            resendResponse: result
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    } catch (resendError) {
      logInfo(`Error received FROM Resend API:`, resendError, requestId);
      throw new Error(`Error al enviar email con Resend: ${JSON.stringify(resendError)}`);
    }
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    logInfo(`Error DURING Resend API call:`, error, requestId);
    console.error(`[${requestId}] Error in send-resend-report (${elapsedTime}ms):`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Internal Server Error",
          requestId: requestId,
          elapsedTime: `${elapsedTime}ms`
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
});
