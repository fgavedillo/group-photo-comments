
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
const supabase = createClient(supabaseUrl, supabaseKey);

// Email sending function with improved error handling
async function sendEmail(recipientEmail: string, subject: string, html: string) {
  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPass) {
      console.error("Gmail credentials not configured");
      throw new Error("Gmail credentials not configured");
    }

    // Create the email payload
    const email = {
      from: EMAIL_SENDER,
      to: recipientEmail,
      subject: subject,
      html: html,
    };

    console.log(`Attempting to send email to ${recipientEmail} with subject: ${subject}`);
    
    // Call the send-email function
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: email,
    });

    if (error) {
      console.error(`Error in send-email function for recipient ${recipientEmail}:`, error);
      throw error;
    }

    if (!data) {
      console.error(`No response received from email function for recipient ${recipientEmail}`);
      throw new Error("No response received from email function");
    }

    console.log(`Email sent successfully to ${recipientEmail}`);
    return data;
  } catch (error) {
    console.error(`Error in sendEmail function for recipient ${recipientEmail}:`, error);
    throw error;
  }
}

// Function to fetch all issues
async function fetchAllIssues(): Promise<ReportRow[]> {
  try {
    const { data, error } = await supabase
      .from("issue_details")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching issues:", error);
      throw error;
    }

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
    console.error("Error in fetchAllIssues:", error);
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
  return issues.filter(issue => 
    issue.status === 'en-estudio' || issue.status === 'en-curso'
  );
}

async function generateAndSendReport(manual: boolean = false, filteredByUser: boolean = false) {
  console.log(`Generating ${filteredByUser ? 'filtered' : 'full'} report${manual ? ' (manual trigger)' : ''}`);
  
  try {
    // Fetch all issues from the database
    const allIssues = await fetchAllIssues();
    
    if (filteredByUser) {
      // When filtering by user, we'll send individual emails to each assigned person
      // with only their pending issues
      const pendingIssues = getPendingIssues(allIssues);
      const issuesByEmail = groupIssuesByEmail(pendingIssues);
      
      // Send individual emails for each user with their pending issues
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        if (userIssues.length === 0) continue; // Skip if no issues
        
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
        
        console.log(`Sent personalized report to ${email} with ${userIssues.length} issues`);
      }
      
      console.log(`Filtered reports sent to ${Object.keys(issuesByEmail).length} users`);
    } else {
      // Standard report to all recipients with all issues
      const report: IssueReport = {
        date: formatDate(new Date()),
        issues: groupIssuesByStatus(allIssues),
        totalCount: allIssues.length,
      };
      
      // Generate HTML
      const html = buildEmailHtml(report);
      
      // Send email to each recipient
      for (const recipientEmail of RECIPIENT_EMAILS) {
        await sendEmail(
          recipientEmail,
          `Reporte Diario de Incidencias (${formatDate(new Date())})`,
          html
        );
      }
      
      console.log(`Standard report sent to ${RECIPIENT_EMAILS.length} recipients`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let manual = false;
    let filteredByUser = false;
    
    // Check if this is a manual trigger or has filtering options
    if (req.method === "POST") {
      const body = await req.json();
      manual = !!body.manual;
      filteredByUser = !!body.filteredByUser;
    }
    
    const result = await generateAndSendReport(manual, filteredByUser);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        stack: error.stack,
        details: "Por favor revise los logs para más detalles."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
