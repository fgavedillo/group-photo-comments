
// Follow deno standards for imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders, handleCors } from "./cors.ts";

// Initialize Resend with API key from environment
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resend = new Resend(resendApiKey);

// Interface for report request
interface ReportRequest {
  filtered?: boolean;
  to?: string[];
  subject?: string;
  html?: string;
}

// Main handler function
serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Received request: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Check if Resend API key is configured
    if (!resendApiKey) {
      console.error("Resend API key not configured");
      throw new Error("Resend API key is not configured. Please contact the administrator.");
    }

    // Only allow POST requests
    if (req.method !== "POST") {
      console.error(`Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Method not allowed" }
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse and validate request body
    const requestData: ReportRequest = await req.json();
    console.log(`[${new Date().toISOString()}] Request data:`, JSON.stringify(requestData));

    // If to, subject, and html are provided directly, send that email
    if (requestData.to && requestData.subject && requestData.html) {
      console.log(`[${new Date().toISOString()}] Sending direct email to ${requestData.to.join(', ')}`);
      
      const result = await resend.emails.send({
        from: 'PRL Conecta <onboarding@resend.dev>',
        to: requestData.to,
        subject: requestData.subject,
        html: requestData.html,
      });
      
      console.log(`[${new Date().toISOString()}] Direct send result:`, result);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            stats: { 
              successCount: requestData.to.length,
              failureCount: 0,
              totalEmails: requestData.to.length
            },
            timestamp: new Date().toISOString(),
            result
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For testing purposes, return a success message
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          stats: { 
            successCount: 1,
            failureCount: 0,
            totalEmails: 1
          },
          message: "Function successfully executed - this is a test response",
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in send-resend-report:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Unknown error sending report",
          details: String(error)
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
