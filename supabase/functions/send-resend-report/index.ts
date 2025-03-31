
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { Resend } from "npm:resend@4.1.2";

// Use explicitly info@prlconecta.es as sender, with the proper domain validation
const FROM_EMAIL = "Sistema de Gestión <info@prlconecta.es>";

// Initialize Resend with API key from environment
const resendApiKey = Deno.env.get("RESEND_API_KEY");

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
  console.log(`[${new Date().toISOString()}] Using FROM address: ${FROM_EMAIL}`);
  console.log(`[${new Date().toISOString()}] API Key length: ${resendApiKey.length}`);
} else {
  console.error(`[${new Date().toISOString()}] Invalid RESEND_API_KEY configuration`);
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
    
    // Ensure we always have an initial HTML for the email
    if (!html || html.trim() === '') {
      throw new Error("HTML content is required");
    }
    
    // Prepare email data for Resend with explicit options to force the from address
    const emailData = {
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
      // Use required settings according to Resend docs to ensure proper sender
      headers: {
        "X-Entity-Ref-ID": logId
      },
      // Add tags to ensure we don't use the Resend default account
      tags: [
        { name: "source", value: "prlconecta" },
        { name: "category", value: "transactional" },
        { name: "force_from", value: "true" }
      ]
    };
    
    logInfo("Attempting to send email to:", to, requestId);
    console.log("Email configuration:", JSON.stringify(emailData, null, 2));
    console.log("FROM address being used:", FROM_EMAIL);
    
    // Send email via Resend
    try {
      const result = await resend.emails.send(emailData);
      
      const elapsedTime = Date.now() - startTime;
      logInfo(`Email sent successfully via Resend in ${elapsedTime}ms:`, result, logId);
      
      // Log more details about the response
      console.log("Full Resend response:", JSON.stringify(result));
      
      // Check if Resend used a different sender
      if (result && result.from && result.from !== FROM_EMAIL) {
        console.error(`WARNING: Resend used a different sender (${result.from}) than requested (${FROM_EMAIL})`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: { 
            message: "Email enviado correctamente con Resend",
            id: result.id,
            recipients: to,
            emailSent: true,
            mode: "all recipients",
            requestId: logId,
            elapsedTime: `${elapsedTime}ms`,
            resendResponse: result,
            fromEmail: FROM_EMAIL, // Para debugging
            actualFromEmail: result.from, // Para verificar el remitente real
            stats: {
              successCount: 1,
              failureCount: 0
            }
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
      console.error("Detailed Resend error:", JSON.stringify(resendError));
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
