
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, SEND_EMAIL_FUNCTION_URL, REQUEST_TIMEOUT } from "./config.ts";
import { ReportRow } from "./types.ts";

// Create a Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Function to create error response with corsHeaders
export function createErrorResponse(error: any, requestId: string, elapsedTime: number) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: error.message || "Error desconocido procesando la solicitud",
        details: error.stack || "No hay detalles adicionales disponibles",
        requestId: requestId
      },
      elapsedTime: `${elapsedTime}ms`
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

// Fetch all issues from the database
export async function fetchAllIssues(requestId: string): Promise<ReportRow[]> {
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Fetching all issues from the database`);
  
  try {
    // Fetch all issues with their related images
    const { data: issues, error } = await supabase
      .from("issues")
      .select(`
        id,
        message,
        timestamp,
        status,
        area,
        responsable,
        action_plan,
        security_improvement,
        assigned_email,
        issue_images(image_url)
      `)
      .order("id", { ascending: false });
      
    if (error) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error fetching issues:`, error);
      throw new Error(`Error fetching issues: ${error.message}`);
    }
    
    // Transform the data for the report
    const reportRows: ReportRow[] = issues.map(issue => ({
      id: issue.id,
      message: issue.message,
      timestamp: issue.timestamp,
      status: issue.status,
      area: issue.area || "",
      responsable: issue.responsable || "",
      actionPlan: issue.action_plan || "",
      securityImprovement: issue.security_improvement || "",
      imageUrl: issue.issue_images?.length > 0 ? issue.issue_images[0].image_url : null,
      assignedEmail: issue.assigned_email || null,
    }));
    
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Fetched ${reportRows.length} issues`);
    
    return reportRows;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error in fetchAllIssues:`, error);
    throw error;
  }
}

// Send email using the send-email Edge Function
export async function sendEmail(
  to: string, 
  subject: string, 
  html: string, 
  requestId: string,
  cc?: string[]
): Promise<void> {
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Sending email to ${to}`);
  
  try {
    // Prepare headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`);
    
    // Add CORS headers
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }
    
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Email payload
    const payload = {
      to,
      subject,
      html,
      cc,
      requestId: `email-${requestId}-${Date.now()}`
    };
    
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Sending email request to Edge Function`);
    
    // Send the request
    const response = await fetch(SEND_EMAIL_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error response from send-email function:`, errorText);
      throw new Error(`Error sending email: HTTP ${response.status} - ${errorText}`);
    }
    
    // Success
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email sent successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error in sendEmail:`, error);
    throw error;
  }
}
