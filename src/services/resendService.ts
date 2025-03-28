
import { getResponsibleEmails } from '@/utils/emailUtils';
import { supabase } from '@/lib/supabase';

export async function sendEmailWithResend(to: string[], subject: string, html: string) {
  try {
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PRL Conecta <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al enviar el correo');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error enviando email con Resend:', error);
    throw error;
  }
}

// Esta función imita la misma estructura que sendReportWithEmailJS
export async function sendReportWithResend(filtered: boolean = false) {
  try {
    // Obtener emails de responsables
    const emails = await getResponsibleEmails();
    console.log('Emails encontrados para Resend:', emails);
    
    if (!emails || emails.length === 0) {
      throw new Error("No se encontraron incidencias con responsable y correo electrónico válidos");
    }

    // Obtener incidencias pendientes
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .in('status', ['en-estudio', 'en-curso']);

    if (issuesError) throw issuesError;
    
    if (!issues || issues.length === 0) {
      throw new Error("No hay incidencias pendientes para reportar");
    }

    // Filtrar y agrupar incidencias por responsable si es necesario
    const issuesByEmail = filtered
      ? groupIssuesByEmail(issues)
      : { all: issues };

    // Enviar emails
    const results = await sendEmails(issuesByEmail, filtered, emails);

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
    if (issue.assigned_email) {
      if (!acc[issue.assigned_email]) {
        acc[issue.assigned_email] = [];
      }
      acc[issue.assigned_email].push(issue);
    }
    return acc;
  }, {} as Record<string, any[]>);
}

async function sendEmails(
  issuesByEmail: Record<string, any[]>,
  filtered: boolean,
  allEmails: string[]
) {
  let successCount = 0;
  let failureCount = 0;

  if (filtered) {
    // Enviar a cada responsable sus incidencias específicas
    for (const [email, issues] of Object.entries(issuesByEmail)) {
      try {
        await sendEmailWithResend(
          [email],
          'Reporte de Incidencias Asignadas - PRL Conecta',
          generateEmailTemplate(issues, true)
        );
        successCount++;
      } catch (error) {
        console.error(`Error enviando a ${email}:`, error);
        failureCount++;
      }
    }
  } else {
    // Enviar reporte completo a todos
    try {
      const allIssues = issuesByEmail.all || [];
      await sendEmailWithResend(
        allEmails,
        'Reporte Completo de Incidencias - PRL Conecta',
        generateEmailTemplate(allIssues, false)
      );
      successCount = allEmails.length;
    } catch (error) {
      console.error('Error enviando reporte completo:', error);
      failureCount = allEmails.length;
    }
  }

  return {
    successCount,
    failureCount,
    totalEmails: successCount + failureCount
  };
}

function generateEmailTemplate(issues: any[], isPersonalized: boolean): string {
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
