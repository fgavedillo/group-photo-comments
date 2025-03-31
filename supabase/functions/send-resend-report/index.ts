
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";

console.log("Loading send-resend-report function");

serve(async (req) => {
  // Handle CORS preflight requests first
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Get the request body
  try {
    console.log(`[${new Date().toISOString()}] Processing request ${req.method} from ${req.headers.get("origin") || "unknown origin"}`);
    
    // Parse the request body
    const requestData = await req.json();
    console.log(`[${new Date().toISOString()}] Request data:`, JSON.stringify(requestData));
    
    // Extract email data
    const { to, subject, html, filtered = false } = requestData;
    
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
    console.log(`[${new Date().toISOString()}] Would send email to:`, to);
    console.log(`[${new Date().toISOString()}] Subject:`, subject);
    console.log(`[${new Date().toISOString()}] Filtered mode:`, filtered ? "yes" : "no");
    
    return new Response(
      JSON.stringify({
        success: true,
        data: { 
          message: "Test response from Edge Function - Connection working!",
          recipients: to,
          emailSent: true,
          mode: filtered ? "filtered" : "all recipients",
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
    console.error(`[${new Date().toISOString()}] Error in send-resend-report function:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Internal Server Error",
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
