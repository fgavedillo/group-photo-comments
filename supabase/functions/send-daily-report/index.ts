
import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { IssueReport, ReportRow, SendDailyReportRequest, SendDailyReportResponse } from "./types.ts";
import { buildEmailHtml } from "./email-template.ts";
import { RECIPIENT_EMAILS, EMAIL_SENDER, corsHeaders, MAX_EXECUTION_TIME } from "./config.ts";
import { formatDate, groupIssuesByStatus } from "./utils.ts";

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Verify essential configuration
if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: Missing Supabase configuration");
  throw new Error("Missing Supabase configuration. Please check environment variables.");
}

console.log(`[${new Date().toISOString()}] Initializing with Supabase URL: ${supabaseUrl.substring(0, 20)}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Email sending function with improved error handling
async function sendEmail(recipientEmail: string, subject: string, html: string, requestId: string) {
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

// Function to fetch all issues
async function fetchAllIssues(requestId: string): Promise<ReportRow[]> {
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

// Group issues by assigned email
function groupIssuesByEmail(issues: ReportRow[]): Record<string, ReportRow[]> {
  const grouped: Record<string, ReportRow[]> = {};
  
  issues.forEach(issue => {
    // Skip issues with no email assigned
    if (!issue.assignedEmail) return;
    
    if (!grouped[issue.assignedEmail]) {
      grouped[issue.assignedEmail] = [];
    }
    
    grouped[issue.assignedEmail].push(issue);
  });
  
  return grouped;
}

// Filter issues for pending actions only (not closed or denied)
function getPendingIssues(issues: ReportRow[]): ReportRow[] {
  const pendingIssues = issues.filter(issue => 
    issue.status === 'en-estudio' || issue.status === 'en-curso'
  );
  return pendingIssues;
}

async function generateAndSendReport(
  manual: boolean = false, 
  filteredByUser: boolean = false,
  requestId: string
): Promise<SendDailyReportResponse> {
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Generating ${filteredByUser ? 'filtered' : 'full'} report${manual ? ' (manual trigger)' : ''}`);
  
  try {
    // Fetch all issues from the database
    const allIssues = await fetchAllIssues(requestId);
    let successCount = 0;
    let failureCount = 0;
    let recipients: string[] = [];
    
    if (filteredByUser) {
      // When filtering by user, we'll send individual emails to each assigned person
      // with only their pending issues
      const pendingIssues = getPendingIssues(allIssues);
      const issuesByEmail = groupIssuesByEmail(pendingIssues);
      
      // Log email distribution plan
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email distribution plan:`);
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        console.log(`[RequestID:${requestId}] - ${email}: ${userIssues.length} pending issues`);
      }
      
      // Send individual emails for each user with their pending issues
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        if (userIssues.length === 0) {
          console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Skipping ${email} - no pending issues`);
          continue; // Skip if no issues
        }
        
        try {
          // Create a report for this specific user
          const userReport: IssueReport = {
            date: formatDate(new Date()),
            issues: groupIssuesByStatus(userIssues),
            totalCount: userIssues.length,
          };
          
          // Generate HTML for this user
          const html = buildEmailHtml(userReport, true);
          
          // Send personalized email
          await sendEmail(
            email,
            `Reporte de Incidencias Asignadas (${formatDate(new Date())})`,
            html,
            requestId
          );
          
          recipients.push(email);
          console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Sent personalized report to ${email} with ${userIssues.length} issues`);
          successCount++;
        } catch (emailError) {
          console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Failed to send email to ${email}:`, emailError);
          failureCount++;
        }
      }
      
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Filtered reports: ${successCount} sent successfully, ${failureCount} failed`);
    } else {
      // Standard report to all recipients with all issues
      const report: IssueReport = {
        date: formatDate(new Date()),
        issues: groupIssuesByStatus(allIssues),
        totalCount: allIssues.length,
      };
      
      // Generate HTML
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Generating HTML for standard report with ${allIssues.length} issues`);
      const html = buildEmailHtml(report);
      
      // Send email to each recipient
      for (const recipientEmail of RECIPIENT_EMAILS) {
        try {
          await sendEmail(
            recipientEmail,
            `Reporte Diario de Incidencias (${formatDate(new Date())})`,
            html,
            requestId
          );
          recipients.push(recipientEmail);
          console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Standard report sent to ${recipientEmail}`);
          successCount++;
        } catch (emailError) {
          console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Failed to send to ${recipientEmail}:`, emailError);
          failureCount++;
        }
      }
      
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Standard reports: ${successCount} sent successfully, ${failureCount} failed`);
    }
    
    return { 
      success: true,
      message: "Reportes enviados correctamente",
      timestamp: new Date().toISOString(),
      requestId,
      recipients: [...new Set(recipients)], // Eliminar duplicados
      stats: {
        totalEmails: successCount + failureCount,
        successCount,
        failureCount
      }
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error generating report:`, error);
    
    const errorResponse: SendDailyReportResponse = {
      success: false,
      message: "Error al generar reportes",
      timestamp: new Date().toISOString(),
      requestId,
      error: {
        code: error.code || "UNKNOWN_ERROR",
        message: error.message || "Error desconocido al generar reportes",
        details: error.stack
      }
    };
    
    return errorResponse;
  }
}

serve(async (req) => {
  // Start timing
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Generar ID de solicitud único
  const requestId = (crypto.randomUUID && crypto.randomUUID()) || 
                    `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Processing request`);
  
  // Set timeout for the entire operation
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Operation timed out after ${MAX_EXECUTION_TIME}ms`);
    timeoutController.abort();
  }, MAX_EXECUTION_TIME);
  
  try {
    // Default values
    let manual = false;
    let filteredByUser = false;
    let clientRequestId = requestId;
    
    // Check if this is a manual trigger or has filtering options
    if (req.method === "POST") {
      try {
        const body: SendDailyReportRequest = await req.json();
        manual = !!body.manual;
        filteredByUser = !!body.filteredByUser;
        
        // Si el cliente proporcionó un ID de solicitud, úsalo para el seguimiento en logs
        if (body.requestId) {
          clientRequestId = body.requestId;
          console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Using client-provided requestId: ${clientRequestId}`);
        }
        
        console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Request params: manual=${manual}, filteredByUser=${filteredByUser}`);
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Error parsing request body:`, parseError);
        // Continue with default values
      }
    }
    
    console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Starting report generation${manual ? " (manual)" : ""}${filteredByUser ? " (filtered)" : ""}`);
    
    const result = await Promise.race([
      generateAndSendReport(manual, filteredByUser, requestId),
      new Promise<never>((_, reject) => {
        // This promise will reject if the controller is aborted
        timeoutController.signal.addEventListener('abort', () => {
          reject(new Error(`Operation timed out after ${MAX_EXECUTION_TIME}ms`));
        });
      })
    ]);
    
    // Clear timeout since operation completed successfully
    clearTimeout(timeoutId);
    
    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Request completed successfully in ${elapsedTime}ms`);
    
    return new Response(JSON.stringify({
      ...result,
      elapsedTime: `${elapsedTime}ms`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Clear timeout if it's still running
    clearTimeout(timeoutId);
    
    // Calculate elapsed time for error case
    const elapsedTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Error processing request (${elapsedTime}ms):`, error);
    
    // Check if this is an abort error from the timeout
    const isTimeoutError = error.name === 'AbortError' || 
                          error.message?.includes('timed out') ||
                          timeoutController.signal.aborted;
    
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
            ? `La operación excedió el tiempo límite de ${MAX_EXECUTION_TIME/1000} segundos` 
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
});
