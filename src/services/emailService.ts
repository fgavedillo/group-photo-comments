import { Resend } from 'resend';
import { Issue } from '@/types/issue';
import { EmailError, EmailOptions, EmailResponse } from '@/types/email';
import { generateIssuesSummaryHtml } from './emailTemplates';
import { EmailQueueService } from './emailQueue';
import { supabase } from '@/lib/supabase';

// Configuración
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const DEFAULT_FROM = 'PRLconecta <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
  throw new Error('La API key de Resend no está configurada en las variables de entorno');
}

const resend = new Resend(RESEND_API_KEY);
const queueService = EmailQueueService.getInstance();

// Validación de email mejorada
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Función para procesar imágenes en el HTML
const processImages = async (html: string): Promise<string> => {
  // Buscar todas las imágenes en el HTML
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  let processedHtml = html;

  while ((match = imgRegex.exec(html)) !== null) {
    const imgUrl = match[1];
    
    try {
      // Verificar si la URL es accesible
      const response = await fetch(imgUrl, { method: 'HEAD' });
      if (!response.ok) {
        // Si la imagen no es accesible, reemplazar con un mensaje
        processedHtml = processedHtml.replace(
          new RegExp(`src="${imgUrl}"`),
          'src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4="'
        );
      }
    } catch (error) {
      // Si hay un error al verificar la imagen, reemplazar con un mensaje
      processedHtml = processedHtml.replace(
        new RegExp(`src="${imgUrl}"`),
        'src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5FcnJvciBhbCBjYXJnYXIgaW1hZ2VuPC90ZXh0Pjwvc3ZnPg=="'
      );
    }
  }

  return processedHtml;
};

// Función principal de envío de email
export const sendEmail = async (
  to: string[],
  subject: string,
  html: string,
  options: EmailOptions = {}
): Promise<EmailResponse> => {
  try {
    // Validar emails
    const validEmails = to.filter(validateEmail);
    if (validEmails.length === 0) {
      throw new EmailError(
        'No hay direcciones de email válidas para enviar',
        'INVALID_EMAILS'
      );
    }

    // Procesar imágenes en el HTML
    const processedHtml = await processImages(html);

    // Configuración por defecto
    const defaultOptions = {
      from: DEFAULT_FROM,
      ...options
    };

    // Añadir a la cola
    const queueId = await queueService.addToQueue(
      validEmails,
      subject,
      processedHtml,
      defaultOptions
    );

    return {
      id: queueId,
      status: 'success',
      message: 'Email añadido a la cola de envío',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error al enviar el email:', error);
    throw error instanceof EmailError ? error : new EmailError(
      'Error al enviar el email',
      'SEND_ERROR',
      error
    );
  }
};

// Función específica para enviar resumen de incidencias
export const sendIssuesSummary = async (issues: Issue[]): Promise<EmailResponse> => {
  try {
    if (!Array.isArray(issues)) {
      throw new EmailError(
        'El parámetro issues debe ser un array',
        'INVALID_ISSUES'
      );
    }

    if (issues.length === 0) {
      throw new EmailError(
        'No hay incidencias para enviar',
        'NO_ISSUES'
      );
    }

    // Agrupar incidencias por email asignado
    const issuesByEmail: Record<string, Issue[]> = {};
    
    issues.forEach(issue => {
      if (issue.assigned_email) {
        if (!issuesByEmail[issue.assigned_email]) {
          issuesByEmail[issue.assigned_email] = [];
        }
        issuesByEmail[issue.assigned_email].push(issue);
      }
    });
    
    const emails = Object.keys(issuesByEmail);
    console.log('Emails encontrados para enviar resumen:', emails);

    if (emails.length === 0) {
      throw new EmailError(
        'No hay destinatarios válidos para enviar el resumen',
        'NO_VALID_RECIPIENTS'
      );
    }

    // Enviar un email a cada responsable con sus incidencias asignadas
    const results = await Promise.allSettled(
      emails.map(async (email) => {
        const userIssues = issuesByEmail[email];
        
        // Generar HTML personalizado para cada responsable
        const customHtml = generateIssuesSummaryHtml(userIssues);
        
        // Usar la Edge Function para enviar el email
        return await supabase.functions.invoke('send-email-v2', {
          body: {
            email,
            custom_html: customHtml,
            subject: `Resumen de Incidencias Asignadas (${userIssues.length}) - PRLconecta`
          }
        });
      })
    );
    
    // Comprobar resultados
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (failed > 0) {
      console.warn(`${failed} emails no pudieron ser enviados`);
    }
    
    if (successful === 0) {
      throw new EmailError(
        'No se pudo enviar ningún email',
        'ALL_EMAILS_FAILED'
      );
    }
    
    return {
      id: 'batch_' + Date.now(),
      status: 'success',
      message: `${successful} de ${emails.length} emails enviados correctamente`,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error al enviar el email de resumen:', error);
    throw error instanceof EmailError ? error : new EmailError(
      'Error al enviar el email de resumen',
      'SUMMARY_SEND_ERROR',
      error
    );
  }
};

/**
 * Envía un email con la información detallada de una incidencia específica
 * al responsable asignado
 */
export const sendSingleIssueEmail = async (issue: Issue): Promise<EmailResponse> => {
  try {
    console.log('Iniciando envío de email para incidencia:', issue);
    
    // Validación más robusta de la incidencia
    if (!issue) {
      console.error('La incidencia es null o undefined');
      throw new EmailError('No se ha proporcionado una incidencia válida', 'INVALID_ISSUE');
    }
    
    // Comprobar si la incidencia tiene una estructura anidada (problemas con array/objeto)
    if (typeof issue === 'object' && '0' in issue && typeof (issue as any)[0] === 'object') {
      console.warn('Estructura de incidencia anidada detectada, intentando corregir');
      issue = {
        ...(issue as any)[0],
        image_url: (issue as any).image_url || (issue as any)[0].image_url || null
      } as Issue;
      console.log('Incidencia corregida:', issue);
    }
    
    if (!issue.id) {
      console.error('La incidencia no tiene ID:', issue);
      throw new EmailError('La incidencia no tiene un ID válido', 'INVALID_ISSUE_ID');
    }
    
    // Verificar si hay email asignado
    if (!issue.assigned_email) {
      console.error('Incidencia sin email asignado:', issue);
      throw new EmailError('La incidencia no tiene un email asignado', 'NO_EMAIL');
    }
    
    const email = issue.assigned_email;
    console.log('Email destinatario:', email);

    // Usar la Edge Function de Supabase para enviar el email
    console.log('Enviando email a través de Edge Function send-email-v2');
    
    const { data, error } = await supabase.functions.invoke('send-email-v2', {
      body: {
        issue_id: issue.id,
        email: email
      }
    });

    if (error) {
      console.error('Error en la Edge Function:', error);
      throw new EmailError(
        'Error al enviar el email a través de la Edge Function',
        'EDGE_FUNCTION_ERROR',
        error
      );
    }

    console.log('Respuesta de la Edge Function:', data);
    
    return {
      id: data?.id || 'unknown',
      status: 'success',
      message: 'Email con detalle de incidencia enviado correctamente',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error general al enviar el email de incidencia:', error);
    
    // Crear un mensaje de error más descriptivo para el usuario
    let userMessage = 'Error al enviar el email de incidencia';
    
    if (error instanceof EmailError) {
      if (error.code === 'NO_EMAIL') {
        userMessage = 'La incidencia no tiene un email asignado. Por favor, asigna un email válido.';
      } else if (error.code === 'INVALID_ISSUE') {
        userMessage = 'Los datos de la incidencia no son válidos. Contacta con soporte.';
      } else if (error.code === 'EDGE_FUNCTION_ERROR') {
        userMessage = 'Error al conectar con el servicio de email. Inténtalo de nuevo más tarde.';
      }
    }
    
    throw new EmailError(
      userMessage,
      error instanceof EmailError ? error.code : 'UNKNOWN_ERROR',
      error
    );
  }
};
