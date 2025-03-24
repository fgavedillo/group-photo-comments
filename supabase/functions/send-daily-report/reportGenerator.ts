
import { ReportRow, IssueReport, SendDailyReportResponse } from "./types.ts";
import { RECIPIENT_EMAILS } from "./config.ts";
import { formatDate, groupIssuesByStatus } from "./utils.ts";
import { sendEmail, fetchAllIssues } from "./services.ts";
import { buildEmailHtml } from "./email-template.ts";

// Group issues by assigned email
function groupIssuesByEmail(issues: ReportRow[], requestId: string): Record<string, ReportRow[]> {
  const grouped: Record<string, ReportRow[]> = {};
  let skippedCount = 0;
  
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Grouping ${issues.length} issues by email`);
  
  issues.forEach(issue => {
    // CRITICAL FIX: Only use assignedEmail field, not responsable name
    const email = issue.assignedEmail;
    
    // Skip issues with no email assigned
    if (!email) {
      skippedCount++;
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Skipping issue ${issue.id} - no assigned email`);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Skipping issue ${issue.id} - invalid email format: ${email}`);
      skippedCount++;
      return;
    }
    
    if (!grouped[email]) {
      grouped[email] = [];
    }
    
    grouped[email].push(issue);
  });
  
  // Log summary
  const emailCount = Object.keys(grouped).length;
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Grouped issues into ${emailCount} unique email addresses. Skipped ${skippedCount} issues without emails.`);
  
  // Log detailed breakdown
  Object.entries(grouped).forEach(([email, issues]) => {
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email ${email}: ${issues.length} issues`);
  });
  
  return grouped;
}

// Filter issues for pending actions only (not closed or denied)
function getPendingIssues(issues: ReportRow[], requestId: string): ReportRow[] {
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Filtering for pending issues from ${issues.length} total issues`);
  
  // CORRECCIÓN: Asegurarse de que estamos filtrando correctamente
  const pendingIssues = issues.filter(issue => 
    issue.status === 'en-estudio' || issue.status === 'en-curso'
  );
  
  // Registro detallado para depuración
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Found ${pendingIssues.length} pending issues`);
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Status breakdown: ${
    issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }`);
  
  // Registrar emails asignados de incidencias pendientes
  const pendingEmails = pendingIssues
    .map(issue => issue.assignedEmail)
    .filter(email => email !== null);
  
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Pending issues with emails: ${pendingEmails.length}`);
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Unique emails found: ${[...new Set(pendingEmails)].join(', ')}`);
  
  return pendingIssues;
}

export async function generateAndSendReport(
  manual: boolean = false, 
  filteredByUser: boolean = false,
  requestId: string,
  debugMode: boolean = false
): Promise<SendDailyReportResponse> {
  console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Generating ${filteredByUser ? 'filtered' : 'full'} report${manual ? ' (manual trigger)' : ''}${debugMode ? ' [DEBUG MODE]' : ''}`);
  
  try {
    // Fetch all issues from the database
    const allIssues = await fetchAllIssues(requestId);
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Total issues fetched: ${allIssues.length}`);
    
    let successCount = 0;
    let failureCount = 0;
    let recipients: string[] = [];
    
    if (filteredByUser) {
      // When filtering by user, we'll send individual emails to each assigned person
      // with only their pending issues
      const pendingIssues = getPendingIssues(allIssues, requestId);
      const issuesByEmail = groupIssuesByEmail(pendingIssues, requestId);
      
      // Log email distribution plan
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email distribution plan:`);
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] - ${email}: ${userIssues.length} pending issues`);
      }
      
      // Si no hay destinatarios cuando se usa el modo filtrado, reportar error
      if (Object.keys(issuesByEmail).length === 0) {
        console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] No recipients found for filtered report`);
        return {
          success: false,
          message: "No se encontraron incidencias con correos electrónicos asignados para enviar reportes filtrados",
          timestamp: new Date().toISOString(),
          requestId,
          recipients: [],
          stats: {
            totalEmails: 0,
            successCount: 0,
            failureCount: 0
          }
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
          
          if (debugMode) {
            console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] [DEBUG] Would send email to ${email} with ${userIssues.length} issues`);
            recipients.push(email);
            successCount++;
            continue;
          }
          
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
      // Standard report to all configured recipients
      // CORRECCIÓN: Para el reporte completo, enviamos a cada responsable no solo a los administradores
      const pendingIssues = getPendingIssues(allIssues, requestId);
      
      if (pendingIssues.length === 0) {
        console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] No pending issues found, sending empty report`);
      }
      
      // Extraer correos únicos de responsables de incidencias pendientes
      const pendingEmails = [...new Set(
        pendingIssues
          .map(issue => issue.assignedEmail)
          .filter(email => email && email.includes('@'))
      )];
      
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Found ${pendingEmails.length} unique responsible emails for complete report`);
      
      // Si no hay correos pendientes, usar los destinatarios configurados en config.ts
      const targetRecipients = pendingEmails.length > 0 ? 
        [...pendingEmails, ...RECIPIENT_EMAILS] : 
        RECIPIENT_EMAILS;
      
      // Eliminar duplicados finales
      const uniqueRecipients = [...new Set(targetRecipients)];
      
      const report: IssueReport = {
        date: formatDate(new Date()),
        issues: groupIssuesByStatus(allIssues),
        totalCount: allIssues.length,
      };
      
      // Generate HTML
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Generating HTML for standard report with ${allIssues.length} issues`);
      const html = buildEmailHtml(report);
      
      // Verificamos que haya destinatarios configurados
      if (uniqueRecipients.length === 0) {
        console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] No recipients configured for complete reports`);
        return {
          success: false,
          message: "No hay destinatarios configurados para enviar reportes completos",
          timestamp: new Date().toISOString(),
          requestId,
          recipients: [],
          stats: {
            totalEmails: 0,
            successCount: 0,
            failureCount: 0
          }
        };
      }
      
      // Log recipients
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Recipients for complete report: ${uniqueRecipients.join(', ')}`);
      
      // Send email to each recipient
      for (const recipientEmail of uniqueRecipients) {
        try {
          if (debugMode) {
            console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] [DEBUG] Would send standard report to ${recipientEmail}`);
            recipients.push(recipientEmail);
            successCount++;
            continue;
          }
          
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
      },
      stats: {
        totalEmails: 0,
        successCount: 0,
        failureCount: 0
      }
    };
    
    return errorResponse;
  }
}
