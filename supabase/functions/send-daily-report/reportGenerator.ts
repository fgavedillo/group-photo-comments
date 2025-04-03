
import { ReportRow, IssueReport, SendDailyReportResponse } from "./types.ts";
import { RECIPIENT_EMAILS } from "./config.ts";
import { formatDate, groupIssuesByStatus } from "./utils.ts";
import { sendEmail, fetchAllIssues } from "./services.ts";
import { buildEmailHtml } from "./email-template.ts";

// Group issues by assigned email
function groupIssuesByEmail(issues: ReportRow[], requestId: string): Record<string, ReportRow[]> {
  console.log(`[${requestId}] Iniciando agrupación de incidencias. Total: ${issues.length}`);
  
  // Asegurar que siempre haya al menos un destinatario por defecto
  const groupedIssues: Record<string, ReportRow[]> = {
    'francisco.garcia@lingotes.com': [] // Email del administrador como fallback
  };
  
  let hasValidRecipients = false;
  
  // Filtrar incidencias para incluir solo aquellas con responsable y correo válido
  const validIssues = issues.filter(issue => 
    issue.responsable && 
    issue.responsable.trim() !== '' && 
    issue.assignedEmail && 
    issue.assignedEmail.trim() !== '' &&
    issue.assignedEmail.includes('@')
  );
  
  console.log(`[${requestId}] Incidencias con responsable y correo válido: ${validIssues.length} de ${issues.length}`);
  
  validIssues.forEach(issue => {
    if (issue.assignedEmail?.trim()) {
      hasValidRecipients = true;
      if (!groupedIssues[issue.assignedEmail]) {
        groupedIssues[issue.assignedEmail] = [];
      }
      groupedIssues[issue.assignedEmail].push(issue);
    } else {
      // Si no tiene email asignado, va al grupo del admin
      groupedIssues['francisco.garcia@lingotes.com'].push(issue);
    }
  });

  console.log(`[${requestId}] Destinatarios encontrados:`, Object.keys(groupedIssues));
  console.log(`[${requestId}] ¿Hay destinatarios válidos?:`, hasValidRecipients);

  return groupedIssues;
}

// Filter issues for pending actions only (not closed or denied) and with valid responsable and email
function getPendingIssues(issues: ReportRow[], requestId: string): ReportRow[] {
  console.log(`[${requestId}] Filtering for pending issues from ${issues.length} total issues`);
  
  // Filtrar incidencias pendientes Y con responsable Y con correo electrónico
  const pendingIssues = issues.filter(issue => 
    (issue.status === 'en-estudio' || issue.status === 'en-curso') &&
    issue.responsable && 
    issue.responsable.trim() !== '' &&
    issue.assignedEmail && 
    issue.assignedEmail.trim() !== '' &&
    issue.assignedEmail.includes('@')
  );
  
  // Registro detallado para depuración
  console.log(`[${requestId}] Found ${pendingIssues.length} pending issues with valid responsable and email`);
  console.log(`[${requestId}] Status breakdown: ${
    issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }`);
  
  // Registrar emails asignados de incidencias pendientes
  const pendingEmails = pendingIssues
    .map(issue => issue.assignedEmail)
    .filter(email => email !== null);
  
  console.log(`[${requestId}] Pending issues with emails: ${pendingEmails.length}`);
  console.log(`[${requestId}] Unique emails found: ${[...new Set(pendingEmails)].join(', ')}`);
  
  return pendingIssues;
}

// Función para generar HTML para un conjunto de incidencias
function generateHtmlForChunk(issues: ReportRow[]): string {
  // Crear un pequeño reporte con este conjunto de incidencias
  const report: IssueReport = {
    date: formatDate(new Date()),
    issues: groupIssuesByStatus(issues),
    totalCount: issues.length,
  };
  
  return buildEmailHtml(report);
}

export async function generateAndSendReport(
  manual: boolean = false, 
  filteredByUser: boolean = false,
  requestId: string,
  debugMode: boolean = false
): Promise<SendDailyReportResponse> {
  console.log(`[${requestId}] Iniciando generación de reporte. Manual: ${manual}, Filtrado: ${filteredByUser}`);
  
  try {
    console.log(`[${requestId}] Obteniendo incidencias de la base de datos...`);
    const issues = await fetchAllIssues(requestId);
    console.log(`[${requestId}] Total de incidencias recuperadas:`, issues.length);
    
    if (issues.length === 0) {
      return {
        success: false,
        message: "No hay incidencias pendientes para reportar",
        timestamp: new Date().toISOString(),
        requestId
      };
    }

    // Filtrar para tener solo incidencias con responsable y correo válido
    const validIssues = issues.filter(issue => 
      issue.responsable && 
      issue.responsable.trim() !== '' && 
      issue.assignedEmail && 
      issue.assignedEmail.trim() !== '' &&
      issue.assignedEmail.includes('@')
    );
    
    console.log(`[${requestId}] Incidencias con responsable y correo válido: ${validIssues.length} de ${issues.length}`);
    
    if (validIssues.length === 0) {
      return {
        success: false,
        message: "No hay incidencias con responsable y correo asignados para reportar",
        timestamp: new Date().toISOString(),
        requestId
      };
    }
    
    const groupedIssues = groupIssuesByEmail(validIssues, requestId);
    
    // Siempre debería haber al menos el email del admin
    const recipients = Object.keys(groupedIssues);
    console.log(`[${requestId}] Destinatarios finales:`, recipients);
    
    let successCount = 0;
    let failureCount = 0;
    
    if (filteredByUser) {
      // When filtering by user, we'll send individual emails to each assigned person
      // with only their pending issues
      const pendingIssues = getPendingIssues(validIssues, requestId);
      const issuesByEmail = groupIssuesByEmail(pendingIssues, requestId);
      
      // Log email distribution plan
      console.log(`[${requestId}] Email distribution plan:`);
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        console.log(`[${requestId}] - ${email}: ${userIssues.length} pending issues`);
      }
      
      // Si no hay destinatarios cuando se usa el modo filtrado, reportar error
      if (Object.keys(issuesByEmail).length === 0) {
        console.error(`[${requestId}] No recipients found for filtered report`);
        return {
          success: false,
          message: "No se encontraron incidencias con correos electrónicos y responsables asignados para enviar reportes filtrados",
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
        if (userIssues.length === 0 || email === 'francisco.garcia@lingotes.com') {
          console.log(`[${requestId}] Skipping ${email} - no pending issues or admin email`);
          continue; // Skip if no issues or admin email (which is already handled)
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
            console.log(`[${requestId}] [DEBUG] Would send email to ${email} with ${userIssues.length} issues`);
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
          console.log(`[${requestId}] Sent personalized report to ${email} with ${userIssues.length} issues`);
          successCount++;
        } catch (emailError) {
          console.error(`[${requestId}] Failed to send email to ${email}:`, emailError);
          failureCount++;
        }
      }
      
      console.log(`[${requestId}] Filtered reports: ${successCount} sent successfully, ${failureCount} failed`);
    } else {
      // Standard report to all configured recipients
      // Para el reporte completo, enviamos a cada responsable y a los administradores
      const pendingIssues = getPendingIssues(validIssues, requestId);
      
      if (pendingIssues.length === 0) {
        console.log(`[${requestId}] No pending issues found, sending empty report`);
      }
      
      // Extraer correos únicos de responsables de incidencias pendientes
      const pendingEmails = [...new Set(
        pendingIssues
          .map(issue => issue.assignedEmail)
          .filter(email => email && email.includes('@'))
      )];
      
      console.log(`[${requestId}] Found ${pendingEmails.length} unique responsible emails for complete report`);
      
      // Si no hay correos pendientes, usar los destinatarios configurados en config.ts
      const targetRecipients = pendingEmails.length > 0 ? 
        [...pendingEmails, ...RECIPIENT_EMAILS] : 
        RECIPIENT_EMAILS;
      
      // Eliminar duplicados finales
      const uniqueRecipients = [...new Set(targetRecipients)];
      
      const report: IssueReport = {
        date: formatDate(new Date()),
        issues: groupIssuesByStatus(pendingIssues),
        totalCount: pendingIssues.length,
      };
      
      // Generate HTML
      console.log(`[${requestId}] Generating HTML for standard report with ${pendingIssues.length} issues`);
      const html = buildEmailHtml(report);
      
      // Verificamos que haya destinatarios configurados
      if (uniqueRecipients.length === 0) {
        console.error(`[${requestId}] No recipients configured for complete reports`);
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
      console.log(`[${requestId}] Recipients for complete report: ${uniqueRecipients.join(', ')}`);
      
      // Dividir el reporte si es muy grande y enviar
      for (const [email, issues] of Object.entries(groupedIssues)) {
        if (issues.length === 0) continue;
        
        const CHUNK_SIZE = 10; // Número de incidencias por email
        const chunks = [];
        for (let i = 0; i < issues.length; i += CHUNK_SIZE) {
          chunks.push(issues.slice(i, i + CHUNK_SIZE));
        }
        
        try {
          // Enviar múltiples emails si es necesario
          for (let i = 0; i < chunks.length; i++) {
            const subject = chunks.length > 1 
              ? `Reporte de Incidencias (Parte ${i + 1}/${chunks.length})`
              : 'Reporte de Incidencias';
              
            await sendEmail(email, subject, generateHtmlForChunk(chunks[i]), requestId);
            successCount++;
          }
          recipients.push(email);
        } catch (error) {
          console.error(`[${requestId}] Failed to send email to ${email}:`, error);
          failureCount++;
        }
      }
      
      console.log(`[${requestId}] Standard reports: ${successCount} sent successfully, ${failureCount} failed`);
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
    console.error(`[${requestId}] Error en generateAndSendReport:`, error);
    return {
      success: false,
      message: "Error al generar o enviar el reporte",
      timestamp: new Date().toISOString(),
      requestId,
      error: {
        code: 'REPORT_GENERATION_ERROR',
        message: error.message,
        details: error.stack
      }
    };
  }
}
