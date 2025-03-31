
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders } from "../send-resend-report/cors.ts";

console.log("Loading send-resend-report function");

serve(async (req) => {
  // Handle CORS preflight requests
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
    
    // This is a simplified implementation for testing
    // In production, you would add actual email sending logic here
    
    return new Response(
      JSON.stringify({
        success: true,
        data: { 
          message: "Test response from Edge Function - Connection working!",
          received: requestData
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
