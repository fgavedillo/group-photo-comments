
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders } from "./cors.ts";

console.log("Loading send-resend-report function");

serve(async (req) => {
  // First check if it's a CORS preflight request and handle it
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Get the request body
  try {
    console.log("Processing request", req.method);
    
    // Parse the request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
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
    console.log("Would send email to:", to);
    console.log("Subject:", subject);
    console.log("Filtered mode:", filtered ? "yes" : "no");
    
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
    console.error("Error in send-resend-report function:", error.message);
    
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
