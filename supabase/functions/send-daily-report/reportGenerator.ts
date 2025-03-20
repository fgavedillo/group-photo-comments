
import { ReportRow, IssueReport, SendDailyReportResponse } from "./types.ts";
import { RECIPIENT_EMAILS } from "./config.ts";
import { formatDate, groupIssuesByStatus } from "./utils.ts";
import { sendEmail, fetchAllIssues } from "./services.ts";
import { buildEmailHtml } from "./email-template.ts";

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

export async function generateAndSendReport(
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
      
      // Si no hay destinatarios cuando se usa el modo filtrado, reportar error
      if (Object.keys(issuesByEmail).length === 0) {
        return {
          success: false,
          message: "No se encontraron responsables con incidencias asignadas para enviar reportes filtrados",
          timestamp: new Date().toISOString(),
          requestId,
          recipients: []
        };
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
          
          // Send personalized email with CC to francisco.garcia@lingotes.com
          await sendEmail(
            email,
            `Reporte de Incidencias Asignadas (${formatDate(new Date())})`,
            html,
            requestId,
            ["francisco.garcia@lingotes.com"] // Add CC to francisco.garcia@lingotes.com
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
      
      // Verificamos que haya destinatarios configurados
      if (!RECIPIENT_EMAILS || RECIPIENT_EMAILS.length === 0) {
        return {
          success: false,
          message: "No hay destinatarios configurados para enviar reportes completos",
          timestamp: new Date().toISOString(),
          requestId,
          recipients: []
        };
      }
      
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
    
    // Si no se pudo enviar ningún correo con éxito, reportar error
    if (successCount === 0) {
      return {
        success: false,
        message: "No se pudo enviar ningún reporte debido a errores de correo",
        timestamp: new Date().toISOString(),
        requestId,
        recipients: [],
        stats: {
          totalEmails: successCount + failureCount,
          successCount,
          failureCount
        }
      };
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
