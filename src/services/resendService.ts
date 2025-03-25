import { getResponsibleEmails } from '@/utils/emailUtils';
import { supabase } from '@/lib/supabase';

const RESEND_API_KEY = 're_M2FFkWg5_5fy9uyFfxrdb9ExipW7kDJe8';

interface IssueData {
  id: string;
  title: string;
  status: string;
  responsable: string;
  assigned_email: string;
  created_at: string;
}

async function sendEmailWithResend(to: string[], subject: string, html: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:8080'
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

    return data;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
}

export async function sendReportWithResend(filtered: boolean = false) {
  try {
    // Obtener emails de responsables
    const emails = await getResponsibleEmails();
    console.log('Emails encontrados:', emails);
    
    if (!emails || emails.length === 0) {
      throw new Error("No se encontraron incidencias con responsable y correo electrónico válidos");
    }

    // Obtener incidencias pendientes
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .in('status', ['en-estudio', 'en-curso']);

    if (issuesError) throw issuesError;
    console.log('Incidencias encontradas:', issues);

    if (!issues || issues.length === 0) {
      throw new Error("No hay incidencias pendientes para reportar");
    }

    // Filtrar y agrupar incidencias por responsable si es necesario
    const issuesByEmail = filtered
      ? groupIssuesByEmail(issues as IssueData[])
      : { all: issues as IssueData[] };

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

function groupIssuesByEmail(issues: IssueData[]) {
  return issues.reduce((acc, issue) => {
    if (issue.assigned_email) {
      if (!acc[issue.assigned_email]) {
        acc[issue.assigned_email] = [];
      }
      acc[issue.assigned_email].push(issue);
    }
    return acc;
  }, {} as Record<string, IssueData[]>);
}

async function sendEmails(
  issuesByEmail: Record<string, IssueData[]>,
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

function generateEmailTemplate(issues: IssueData[], isPersonalized: boolean): string {
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
              <h3>${issue.title}</h3>
              <p><strong>Estado:</strong> <span class="status ${issue.status}">${issue.status}</span></p>
              <p><strong>Responsable:</strong> ${issue.responsable}</p>
              <p><strong>Fecha de creación:</strong> ${new Date(issue.created_at).toLocaleDateString('es-ES')}</p>
            </div>
          `).join('')}
      </body>
    </html>
  `;
} 