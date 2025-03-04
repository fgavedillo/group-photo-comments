
import { ReportRow, SendDailyReportResponse } from "./types.ts";
import { corsHeaders } from "./config.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch all issues from the database
export async function fetchAllIssues(requestId: string): Promise<ReportRow[]> {
  try {
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Fetching issues from database...`);
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from("issue_details")
      .select("*")
      .order("timestamp", { ascending: false });

    const elapsedTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Database query completed in ${elapsedTime}ms`);

    if (error) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error fetching issues:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] No issues found in database`);
      return [];
    }

    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Retrieved ${data.length} issues from database`);

    return (data || []).map((issue) => ({
      id: issue.id,
      message: issue.message || "",
      timestamp: new Date(issue.timestamp).toISOString(),
      status: issue.status || "en-estudio",
      area: issue.area || "No especificada",
      responsable: issue.responsable || "Sin asignar",
      actionPlan: issue.action_plan || "",
      securityImprovement: issue.security_improvement || "",
      imageUrl: issue.image_url || null,
      assignedEmail: issue.assigned_email || null,
    }));
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error in fetchAllIssues:`, error);
    throw error;
  }
}

// Email sending function with improved error handling
export async function sendEmail(recipientEmail: string, subject: string, html: string, requestId: string) {
  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPass) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Gmail credentials not configured`);
      throw new Error("Gmail credentials not configured");
    }

    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Attempting to send email to ${recipientEmail} with subject: ${subject}`);
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] HTML content length: ${html.length} characters`);
    
    // Create the email payload
    const email = {
      to: recipientEmail,
      subject: subject,
      html: html,
      requestId: requestId
    };

    // Call the send-email function with improved error handling
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Invoking send-email function`);
    const functionStartTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: email,
    });

    const functionElapsedTime = Date.now() - functionStartTime;
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] send-email function call completed in ${functionElapsedTime}ms`);

    if (error) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error in send-email function for recipient ${recipientEmail}:`, error);
      throw error;
    }

    if (!data) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] No response received from email function for recipient ${recipientEmail}`);
      throw new Error("No response received from email function");
    }

    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email sent successfully to ${recipientEmail}`);
    return data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error in sendEmail function for recipient ${recipientEmail}:`, error);
    throw error;
  }
}

// Create standardized error response
export function createErrorResponse(error: any, requestId: string, elapsedTime: number): Response {
  // Check if this is an abort error from the timeout
  const isTimeoutError = error.name === 'AbortError' || 
                        error.message?.includes('timed out') ||
                        error.aborted;
  
  // Prepare detailed error information
  const errorInfo = {
    message: error.message || "Unknown error occurred",
    stack: error.stack || "No stack trace available",
    name: error.name || "Error",
    isTimeout: isTimeoutError,
    ...(error.cause ? { cause: JSON.stringify(error.cause) } : {})
  };
  
  // Return detailed error response
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: {
        code: isTimeoutError ? "TIMEOUT_ERROR" : "EXECUTION_ERROR",
        message: isTimeoutError 
          ? `La operación excedió el tiempo límite de ${25000/1000} segundos` 
          : errorInfo.message,
        details: errorInfo.stack
      },
      requestId,
      timestamp: new Date().toISOString(),
      elapsedTime: `${elapsedTime}ms`
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isTimeoutError ? 408 : 500,
    }
  );
}
