
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
  console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error details:`, error);
  
  // Intentar extraer un mensaje de error más descriptivo
  let errorMessage = error.message || "Error desconocido procesando la solicitud";
  let errorDetails = error.stack || "No hay detalles adicionales disponibles";
  
  // Si hay información más específica en error.cause
  if (error.cause) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error cause:`, error.cause);
    if (error.cause.message) {
      errorMessage = `${errorMessage} - ${error.cause.message}`;
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: errorMessage,
        details: errorDetails,
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
    // CORRECCIÓN: Mejorado el debug y estructura de la consulta
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Using Supabase URL: ${Deno.env.get("SUPABASE_URL") || "Not set"}`);
    
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
    
    if (!issues || issues.length === 0) {
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] No issues found in database`);
      return [];
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
    
    // Log status distribution
    const statusCounts: Record<string, number> = {};
    const emailCounts: Record<string, number> = {};
    
    reportRows.forEach(row => {
      // Contar por estado
      if (!statusCounts[row.status]) statusCounts[row.status] = 0;
      statusCounts[row.status]++;
      
      // Contar por email asignado
      if (row.assignedEmail) {
        if (!emailCounts[row.assignedEmail]) emailCounts[row.assignedEmail] = 0;
        emailCounts[row.assignedEmail]++;
      }
    });
    
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Issues by status:`, statusCounts);
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Issues by assigned email:`, emailCounts);
    
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
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Sending email to ${to} with CC: ${cc?.join(", ") || "none"}`);
  
  try {
    // Prepare headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("apikey", Deno.env.get("SUPABASE_ANON_KEY") || "");
    
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
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Using URL: ${SEND_EMAIL_FUNCTION_URL}`);
    
    // Send the request
    const response = await fetch(SEND_EMAIL_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Get the response body
    const responseBody = await response.text();
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email function response:`, responseBody);
    
    // Check for errors
    if (!response.ok) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error response from send-email function:`, responseBody);
      
      try {
        // Try to parse as JSON to get more details
        const errorData = JSON.parse(responseBody);
        throw new Error(`Error sending email: HTTP ${response.status} - ${errorData.error?.message || responseBody}`);
      } catch (parseError) {
        // If parsing fails, use the raw response
        throw new Error(`Error sending email: HTTP ${response.status} - ${responseBody}`);
      }
    }
    
    // Success
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email sent successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error in sendEmail:`, error);
    throw error;
  }
}
