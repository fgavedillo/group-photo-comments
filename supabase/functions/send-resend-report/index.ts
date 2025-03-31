
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";

console.log(`[${new Date().toISOString()}] Loading send-resend-report function`);

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
    
    // In a real implementation, this would send emails via Resend or another provider
    // For testing, just log the data and return success
    console.log(`[${new Date().toISOString()}] [${logId}] Would send email to:`, to);
    console.log(`[${new Date().toISOString()}] [${logId}] Subject:`, subject);
    console.log(`[${new Date().toISOString()}] [${logId}] Filtered mode:`, filtered ? "yes" : "no");
    
    const elapsedTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [${logId}] Request completed successfully in ${elapsedTime}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: { 
          message: "Test response from Edge Function - Connection working!",
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
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [${requestId}] Error in send-resend-report function (${elapsedTime}ms):`, error.message);
    
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
