
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { Resend } from "npm:resend@2.0.0";

// Use API key from environment variable
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || 're_2TqHgv5B_62eNDe38YRyhnXfzSjmp2ShP';

// Logger configuration
const config = {
  debug: true,
  logInfo: (message: string, ...args: any[]) => {
    if (config.debug) {
      console.log(`[${new Date().toISOString()}] ${message}`, ...args);
    }
  },
  logError: (message: string, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] ${message}`, ...args);
  }
};

// Configure the verified sender
// Using Resend's default verified domain (onboarding@resend.dev) instead of the custom domain
const FROM_ADDRESS = "PRL Conecta <onboarding@resend.dev>";

console.log(`[${new Date().toISOString()}] Loading send-resend-report function`);

// Validate configuration
try {
  if (!RESEND_API_KEY || RESEND_API_KEY.length < 10) {
    throw new Error("Invalid Resend API Key configuration");
  }
  console.log(`[${new Date().toISOString()}] Configuration validated successfully`);
  console.log(`[${new Date().toISOString()}] Using FROM address: ${FROM_ADDRESS}`);
} catch (error) {
  console.error(`[${new Date().toISOString()}] Configuration error:`, error.message);
}

serve(async (req) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  console.log(`[${new Date().toISOString()}] [${requestId}] Received ${req.method} request from ${req.headers.get("origin") || "unknown origin"}`);
  
  // Handle CORS preflight requests first
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    console.log(`[${new Date().toISOString()}] [${requestId}] Request data:`, JSON.stringify(requestData));
    
    // Extract email data
    const { to, subject, html, filtered = false, clientRequestId } = requestData;
    
    // Use client-provided request ID if available for easier tracking
    const logId = clientRequestId || requestId;
    
    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error("Recipients (to) are required and must be an array");
    }
    
    if (!subject) {
      throw new Error("Subject is required");
    }
    
    if (!html) {
      throw new Error("HTML content is required");
    }
    
    // Create Resend instance
    const resend = new Resend(RESEND_API_KEY);
    
    config.logInfo(`[${logId}] Attempting to send email to (from config.logInfo):`, to);
    console.log(`[${logId}] Attempting to send email to (from console.log):`, to);
    
    // Send email via Resend
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: to,
        subject: subject,
        html: html,
      });
      
      if (error) {
        console.error(`[${new Date().toISOString()}] [${logId}] Error received FROM Resend API:`, error);
        throw new Error(`Error al enviar email con Resend: ${JSON.stringify(error)}`);
      }
      
      const elapsedTime = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] [${logId}] Email sent successfully in ${elapsedTime}ms`);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: { 
            message: "Email sent successfully via Resend!",
            id: data?.id || null,
            recipients: to,
            emailSent: true,
            mode: filtered ? "filtered" : "all recipients",
            requestId: logId,
            elapsedTime: `${elapsedTime}ms`,
            stats: {
              successCount: to.length,
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
    } catch (sendError) {
      console.error(`[${new Date().toISOString()}] [${logId}] Error: Error DURING Resend API call:`, sendError);
      throw sendError;
    }
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [${requestId}] Error in send-resend-report (${elapsedTime}ms):`, error.message);
    
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
