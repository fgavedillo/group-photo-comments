
import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { IssueReport, ReportRow } from "./types.ts";
import { buildEmailHtml } from "./email-template.ts";
import { RECIPIENT_EMAILS, EMAIL_SENDER } from "./config.ts";
import { formatDate, groupIssuesByStatus } from "./utils.ts";

// Set up CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
async function sendEmail(recipientEmail: string, subject: string, html: string) {
  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPass) {
      console.error(`[${new Date().toISOString()}] Gmail credentials not configured`);
      throw new Error("Gmail credentials not configured");
    }

    console.log(`[${new Date().toISOString()}] Attempting to send email to ${recipientEmail} with subject: ${subject}`);
    console.log(`[${new Date().toISOString()}] HTML content length: ${html.length} characters`);
    
    // Log beginning of HTML content for debugging
    const htmlPreview = html.substring(0, 200) + "...";
    console.log(`[${new Date().toISOString()}] HTML preview: ${htmlPreview}`);
    
    // Create the email payload
    const email = {
      to: recipientEmail,
      subject: subject,
      html: html,
    };

    // Call the send-email function with improved error handling
    console.log(`[${new Date().toISOString()}] Invoking send-email function`);
    const functionStartTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: email,
    });

    const functionElapsedTime = Date.now() - functionStartTime;
    console.log(`[${new Date().toISOString()}] send-email function call completed in ${functionElapsedTime}ms`);

    if (error) {
      console.error(`[${new Date().toISOString()}] Error in send-email function for recipient ${recipientEmail}:`, error);
      throw error;
    }

    if (!data) {
      console.error(`[${new Date().toISOString()}] No response received from email function for recipient ${recipientEmail}`);
      throw new Error("No response received from email function");
    }

    console.log(`[${new Date().toISOString()}] Email sent successfully to ${recipientEmail}`);
    return data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in sendEmail function for recipient ${recipientEmail}:`, error);
    throw error;
  }
}

// Function to fetch all issues
async function fetchAllIssues(): Promise<ReportRow[]> {
  try {
    console.log(`[${new Date().toISOString()}] Fetching issues from database...`);
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from("issue_details")
      .select("*")
      .order("timestamp", { ascending: false });

    const elapsedTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Database query completed in ${elapsedTime}ms`);

    if (error) {
      console.error(`[${new Date().toISOString()}] Error fetching issues:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`[${new Date().toISOString()}] No issues found in database`);
      return [];
    }

    console.log(`[${new Date().toISOString()}] Retrieved ${data.length} issues from database`);

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
    console.error(`[${new Date().toISOString()}] Error in fetchAllIssues:`, error);
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
  console.log(`[${new Date().toISOString()}] Filtered ${pendingIssues.length} pending issues from ${issues.length} total issues`);
  return pendingIssues;
}

async function generateAndSendReport(manual: boolean = false, filteredByUser: boolean = false) {
  console.log(`[${new Date().toISOString()}] Generating ${filteredByUser ? 'filtered' : 'full'} report${manual ? ' (manual trigger)' : ''}`);
  
  try {
    // Fetch all issues from the database
    const allIssues = await fetchAllIssues();
    
    if (filteredByUser) {
      // When filtering by user, we'll send individual emails to each assigned person
      // with only their pending issues
      const pendingIssues = getPendingIssues(allIssues);
      const issuesByEmail = groupIssuesByEmail(pendingIssues);
      
      // Log email distribution plan
      console.log(`[${new Date().toISOString()}] Email distribution plan:`);
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        console.log(`- ${email}: ${userIssues.length} pending issues`);
      }
      
      // Send individual emails for each user with their pending issues
      let successCount = 0;
      let failureCount = 0;
      
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        if (userIssues.length === 0) {
          console.log(`[${new Date().toISOString()}] Skipping ${email} - no pending issues`);
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
            html
          );
          
          console.log(`[${new Date().toISOString()}] Sent personalized report to ${email} with ${userIssues.length} issues`);
          successCount++;
        } catch (emailError) {
          console.error(`[${new Date().toISOString()}] Failed to send email to ${email}:`, emailError);
          failureCount++;
        }
      }
      
      console.log(`[${new Date().toISOString()}] Filtered reports: ${successCount} sent successfully, ${failureCount} failed`);
    } else {
      // Standard report to all recipients with all issues
      const report: IssueReport = {
        date: formatDate(new Date()),
        issues: groupIssuesByStatus(allIssues),
        totalCount: allIssues.length,
      };
      
      // Generate HTML
      console.log(`[${new Date().toISOString()}] Generating HTML for standard report with ${allIssues.length} issues`);
      const html = buildEmailHtml(report);
      
      // Send email to each recipient
      let successCount = 0;
      let failureCount = 0;
      
      for (const recipientEmail of RECIPIENT_EMAILS) {
        try {
          await sendEmail(
            recipientEmail,
            `Reporte Diario de Incidencias (${formatDate(new Date())})`,
            html
          );
          console.log(`[${new Date().toISOString()}] Standard report sent to ${recipientEmail}`);
          successCount++;
        } catch (emailError) {
          console.error(`[${new Date().toISOString()}] Failed to send to ${recipientEmail}:`, emailError);
          failureCount++;
        }
      }
      
      console.log(`[${new Date().toISOString()}] Standard reports: ${successCount} sent successfully, ${failureCount} failed`);
    }
    
    return { 
      success: true,
      message: "Reportes enviados correctamente",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error generating report:`, error);
    throw error;
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
  
  // Log request details for debugging
  const requestId = crypto.randomUUID();
  console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Processing request`);
  
  try {
    // Default values
    let manual = false;
    let filteredByUser = false;
    
    // Check if this is a manual trigger or has filtering options
    if (req.method === "POST") {
      try {
        const body = await req.json();
        manual = !!body.manual;
        filteredByUser = !!body.filteredByUser;
        console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Request params: manual=${manual}, filteredByUser=${filteredByUser}`);
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Error parsing request body:`, parseError);
        // Continue with default values
      }
    }
    
    console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Starting report generation${manual ? " (manual)" : ""}${filteredByUser ? " (filtered)" : ""}`);
    const result = await generateAndSendReport(manual, filteredByUser);
    
    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Request completed successfully in ${elapsedTime}ms`);
    
    return new Response(JSON.stringify({
      ...result,
      requestId,
      elapsedTime: `${elapsedTime}ms`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Calculate elapsed time for error case
    const elapsedTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Error processing request (${elapsedTime}ms):`, error);
    
    // Prepare detailed error information
    const errorInfo = {
      message: error.message || "Unknown error occurred",
      stack: error.stack || "No stack trace available",
      name: error.name || "Error",
      ...(error.cause ? { cause: JSON.stringify(error.cause) } : {})
    };
    
    // Return detailed error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorInfo.message,
        stack: errorInfo.stack,
        errorType: errorInfo.name,
        details: "Por favor revise los logs para más detalles.",
        requestId,
        elapsedTime: `${elapsedTime}ms`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
