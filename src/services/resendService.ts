
import { getResponsibleEmails } from '@/utils/emailUtils';
import supabase from '@/lib/supabaseClient';
import { sendReport } from './reportSender';

// Función principal para enviar reportes con Resend
export async function sendReportWithResend(filtered: boolean = false) {
  try {
    // Obtener emails de responsables
    const emails = await getResponsibleEmails();
    console.log('Emails encontrados para Resend:', emails);
    
    if (!emails || emails.length === 0) {
      throw new Error("No se encontraron incidencias con responsable y correo electrónico válidos");
    }

    // Obtener incidencias pendientes (en estudio o en curso)
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .in('status', ['en-estudio', 'en-curso']);

    if (issuesError) {
      console.error("Error al obtener incidencias:", issuesError);
      throw issuesError;
    }
    
    console.log('Incidencias pendientes encontradas:', issues?.length || 0);
    
    if (!issues || issues.length === 0) {
      throw new Error("No hay incidencias pendientes para reportar");
    }

    // Filtrar incidencias que tienen responsable y correo asignados
    const validIssues = issues.filter(issue => 
      issue.responsable && 
      issue.responsable.trim() !== '' && 
      issue.assigned_email && 
      issue.assigned_email.trim() !== ''
    );
    
    console.log('Incidencias con responsable y correo:', validIssues.length);
    
    if (validIssues.length === 0) {
      throw new Error("No hay incidencias con responsable y correo asignados para reportar");
    }

    // Filtrar y agrupar incidencias por responsable si es necesario
    const issuesByEmail = filtered
      ? groupIssuesByEmail(validIssues)
      : { all: validIssues };
    
    // Verificar que hay destinatarios después de agrupar (solo si es modo personalizado)
    if (filtered && Object.keys(issuesByEmail).length === 0) {
      throw new Error("No hay destinatarios con incidencias asignadas para enviar el reporte personalizado");
    }

    // Asegurarnos de que los emails son strings válidos
    const validEmailStrings = emails.filter(e => typeof e === 'string') as string[];
    
    if (validEmailStrings.length === 0) {
      throw new Error("No hay direcciones de correo válidas para enviar el reporte");
    }

    // Enviar emails
    const results = await sendEmails(issuesByEmail, filtered, validEmailStrings);
    console.log('Resultados del envío con Resend:', results);

    return {
      success: true,
      stats: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error en sendReportWithResend:', error);
    throw error;
  }
}

function groupIssuesByEmail(issues: any[]) {
  return issues.reduce((acc, issue) => {
    if (issue.assigned_email && issue.assigned_email.trim() !== '') {
      const email = issue.assigned_email.trim();
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(issue);
    }
    return acc;
  }, {});
}

async function sendEmails(
  issuesByEmail: any,
  filtered: boolean,
  allEmails: string[]
) {
  let successCount = 0;
  let failureCount = 0;

  try {
    if (filtered) {
      // Enviar a cada responsable sus incidencias específicas
      for (const [email, issues] of Object.entries(issuesByEmail)) {
        try {
          if (!email || email.trim() === '') {
            console.warn('Saltando email vacío');
            continue;
          }
          
          await sendReport(
            [email],
            generateEmailHTML(issues as any[], true)
          );
          successCount++;
        } catch (error) {
          console.error(`Error enviando a ${email}:`, error);
          failureCount++;
        }
      }
    } else {
      // Enviar reporte completo a todos los responsables
      try {
        const allIssues = issuesByEmail.all || [];
        const uniqueEmails = [...new Set(allEmails.filter(email => email && email.trim() !== ''))];
        
        if (uniqueEmails.length === 0) {
          throw new Error("No hay destinatarios válidos para enviar el reporte");
        }
        
        await sendReport(
          uniqueEmails,
          generateEmailHTML(allIssues, false)
        );
        successCount = uniqueEmails.length;
      } catch (error) {
        console.error('Error enviando reporte completo:', error);
        failureCount = allEmails.length;
      }
    }
  } catch (error) {
    console.error('Error general en sendEmails:', error);
  }

  return {
    successCount,
    failureCount,
    totalEmails: successCount + failureCount
  };
}

function generateEmailHTML(issues: any[], isPersonalized: boolean) {
  const date = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .header { background: #f8f9fa; padding: 20px; margin-bottom: 20px; }
          .issue { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
          .status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
          .en-estudio { background: #fff3cd; color: #856404; }
          .en-curso { background: #cce5ff; color: #004085; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Incidencias${isPersonalized ? ' Asignadas' : ''}</h1>
          <p>Fecha: ${date}</p>
        </div>
        
        ${issues.length === 0 
          ? '<p>No hay incidencias pendientes en este momento.</p>'
          : issues.map(issue => `
            <div class="issue">
              <h3>${issue.title || issue.message}</h3>
              <p><strong>Estado:</strong> <span class="status ${issue.status}">${issue.status}</span></p>
              <p><strong>Responsable:</strong> ${issue.responsable || 'No asignado'}</p>
              <p><strong>Fecha de creación:</strong> ${new Date(issue.created_at || issue.timestamp).toLocaleDateString('es-ES')}</p>
            </div>
          `).join('')}
      </body>
    </html>
  `;
}
