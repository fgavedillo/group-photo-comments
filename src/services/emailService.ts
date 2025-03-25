import { callApi, ApiResponse } from './api/apiClient';
import emailjs from '@emailjs/browser';
import { getResponsibleEmails } from '@/utils/emailUtils';
import { supabase } from '@/lib/supabase';
import { useEmailJS, EmailJSTemplateParams } from '@/hooks/useEmailJS';

/**
 * Interfaz para la respuesta del envío de email
 */
interface EmailSendResponse {
  success: boolean;
  message?: string;
  recipients?: string[];
  elapsedTime?: string;
  requestId?: string;
  processingTime?: string;
  messageId?: string;
}

/**
 * Constantes para URLs
 */
const FUNCTIONS_BASE_URL = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1";
const DAILY_REPORT_FUNCTION = `${FUNCTIONS_BASE_URL}/send-daily-report`;
const EMAIL_FUNCTION = `${FUNCTIONS_BASE_URL}/send-email`;

// Configuración de EmailJS
// IMPORTANTE: Verifica que estos valores coincidan exactamente con tu cuenta de EmailJS
// Puedes encontrarlos en: https://dashboard.emailjs.com/admin
// SERVICE_ID: En la sección "Email Services"
// TEMPLATE_ID: En la sección "Email Templates"
// PUBLIC_KEY: En la sección "Account" -> "API Keys"
const SERVICE_ID = 'service_yz5opji';
const TEMPLATE_ID = 'template_ddq6b3h';
const PUBLIC_KEY = 'RKDqUO9tTPGJrGKLQ';

const CONFIG = {
  serviceId: SERVICE_ID,
  templateId: TEMPLATE_ID,
  publicKey: PUBLIC_KEY,
};

interface IssueData {
  id: string;
  title: string;
  status: string;
  responsable: string;
  assigned_email: string;
  created_at: string;
}

// Inicializar EmailJS con la clave pública
console.log('Inicializando EmailJS con PUBLIC_KEY:', PUBLIC_KEY);
emailjs.init(PUBLIC_KEY);

// Email validation function
const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  email = email.trim();
  if (email === '') return false;
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Envía un reporte por correo manual (filtrado o completo)
 */
export const sendManualEmail = async (filtered: boolean = false): Promise<ApiResponse<EmailSendResponse>> => {
  try {
    console.log(`Iniciando envío de correo manual (${filtered ? 'filtrado' : 'completo'})`);
    
    // Generar ID único para esta solicitud
    const requestId = `manual-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Enviar solicitud con timeout apropiado
    return await callApi<EmailSendResponse>(
      DAILY_REPORT_FUNCTION,
      'POST',
      { 
        manual: true,
        filteredByUser: filtered,
        requestId
      },
      { 
        timeout: 60000, // 60 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error general en el envío de correo:', error);
    
    // Verificar si es un error de red
    const isNetworkError = 
      error.message?.includes('Failed to fetch') || 
      error.message?.includes('Network Error') ||
      error.message?.includes('network');
    
    return {
      success: false,
      error: {
        message: isNetworkError
          ? 'Error de conexión: No se pudo contactar al servidor. Verifique su conexión a internet.'
          : error.message || 'No se pudo enviar el correo programado',
        details: `
          Error general en la función de envío de correo:
          - Mensaje: ${error.message || 'No disponible'}
          - Stack: ${error.stack || 'No disponible'}
          
          ${isNetworkError ? `
          Es posible que:
          1. Su conexión a internet esté fallando
          2. El servidor de Supabase no esté disponible
          3. La función edge no esté publicada correctamente
          
          Recomendación: Verifique su conexión y que la función edge esté publicada.
          ` : `
          Esto puede ser un error en el código del cliente o un problema con la conexión.
          Recomendación: Revise la consola del navegador para más detalles.
          `}
        `,
        code: isNetworkError ? 'NETWORK_ERROR' : 'CLIENT_ERROR',
        context: { 
          originalError: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        }
      }
    };
  }
};

/**
 * Prueba la conexión con el servidor de correo
 */
export const testEmailConnection = async (): Promise<ApiResponse<{success: boolean, details?: string}>> => {
  try {
    console.log("Probando conexión con el servidor de correo...");
    
    // Realizar una solicitud OPTIONS para verificar que el servidor responde
    const response = await fetch(EMAIL_FUNCTION, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        success: true,
        data: {
          success: true,
          details: `El servidor respondió correctamente con estado ${response.status}`
        }
      };
    } else {
      return {
        success: false,
        error: {
          message: `Error de conexión: El servidor respondió con estado ${response.status}`,
          code: 'CONNECTION_ERROR',
          details: `La función de correo respondió con estado ${response.status} ${response.statusText}`
        }
      };
    }
  } catch (error) {
    console.error("Error probando la conexión:", error);
    
    return {
      success: false,
      error: {
        message: "No se pudo establecer conexión con el servidor de correo",
        code: 'CONNECTION_ERROR',
        details: `Error: ${error.message || 'Error desconocido'}`
      }
    };
  }
};

export async function sendReportWithEmailJS(filtered: boolean = false) {
  try {
    // Obtener emails de responsables
    const emails = await getResponsibleEmails();
    console.log('Emails encontrados:', emails);
    
    if (!emails || emails.length === 0) {
      throw new Error("No se encontraron incidencias con responsable y correo electrónico válidos");
    }

    // Validar emails antes de continuar
    const validEmails = emails.filter(email => email && email.trim() !== '');
    console.log('Emails válidos:', validEmails);
    
    if (validEmails.length === 0) {
      throw new Error("Todos los correos encontrados son inválidos o están vacíos");
    }

    // Obtener incidencias pendientes
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .in('status', ['en-estudio', 'en-curso']);

    if (issuesError) throw issuesError;
    console.log('Incidencias encontradas:', issues?.length || 0);

    if (!issues || issues.length === 0) {
      throw new Error("No hay incidencias pendientes para reportar");
    }

    // Filtrar y agrupar incidencias por responsable si es necesario
    const issuesByEmail = filtered
      ? groupIssuesByEmail(issues as IssueData[])
      : { all: issues as IssueData[] };
    
    // Verificar que hay destinatarios después de agrupar (solo si es modo personalizado)
    if (filtered && Object.keys(issuesByEmail).length === 0) {
      throw new Error("No hay destinatarios con incidencias asignadas para enviar el reporte personalizado");
    }
    
    console.log('Preparando envío de correos...');

    // Enviar emails
    const results = await sendEmails(issuesByEmail, filtered, validEmails);
    console.log('Resultados del envío:', results);

    return {
      success: true,
      stats: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error en sendReportWithEmailJS:', error);
    throw error;
  }
}

function groupIssuesByEmail(issues: IssueData[]) {
  return issues.reduce((acc, issue) => {
    if (issue.assigned_email && issue.assigned_email.trim() !== '') {
      const email = issue.assigned_email.trim();
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(issue);
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

  // Filtra y valida los correos antes de enviar
  const validEmails = allEmails.filter(email => email && email.trim() !== '');
  
  if (validEmails.length === 0) {
    throw new Error("No hay destinatarios válidos para enviar el reporte");
  }

  if (filtered) {
    // Enviar a cada responsable sus incidencias específicas
    for (const [email, issues] of Object.entries(issuesByEmail)) {
      try {
        if (email && email.trim() !== '') {
          await sendEmail(
            [email.trim()], 
            'Reporte de Incidencias Asignadas - PRL Conecta',
            generateEmailTemplate(issues, true)
          );
          successCount++;
        } else {
          console.warn(`Saltando destinatario con correo vacío`);
          failureCount++;
        }
      } catch (error) {
        console.error(`Error enviando a ${email}:`, error);
        failureCount++;
      }
    }
  } else {
    // Enviar reporte completo a todos
    const allIssues = issuesByEmail.all || [];
    
    for (const email of validEmails) {
      try {
        await sendEmail(
          [email],
          'Reporte Completo de Incidencias - PRL Conecta',
          generateEmailTemplate(allIssues, false)
        );
        successCount++;
      } catch (error) {
        console.error(`Error enviando a ${email}:`, error);
        failureCount++;
      }
    }
  }

  return {
    successCount,
    failureCount,
    totalEmails: successCount + failureCount
  };
}

// Función de diagnóstico para probar un envío simple
export async function testEmailJS() {
  try {
    console.log('Iniciando prueba de EmailJS...');
    
    // Email de prueba que puede modificarse
    const testEmail = "test@example.com"; // Cámbialo por tu correo real
    
    // Formatear la fecha correctamente
    const fechaFormateada = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    // Parámetros completos para prueba
    const templateParams = {
      email_to: testEmail,
      name: 'PRL Conecta',
      date: fechaFormateada,
      message: "Este es un mensaje de prueba simple.",
      subject: "Prueba diagnóstico EmailJS",
      title: "Prueba diagnóstico EmailJS"
    };
    
    console.log('Parámetros de prueba:', JSON.stringify(templateParams, null, 2));
    
    const response = await emailjs.send(
      CONFIG.serviceId,
      CONFIG.templateId,
      templateParams
    );
    
    console.log('Prueba exitosa:', response);
    return response;
  } catch (error) {
    if (error.text) {
      console.error(`Error detallado: ${error.text}`);
    }
    
    if (error.status) {
      console.error(`Estado del error: ${error.status}`);
    }
    
    console.error('Error completo en prueba:', error);
    throw error;
  }
}

// Función para enviar un correo de prueba utilizando la misma lógica que las incidencias
export async function sendTestEmail(toEmail: string) {
  try {
    console.log(`Enviando correo de prueba a ${toEmail}...`);
    
    // Validar email
    if (!validateEmail(toEmail)) {
      throw new Error(`El email del destinatario '${toEmail}' no es válido o está vacío`);
    }
    
    // Formatear la fecha correctamente
    const fechaFormateada = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    // Obtener el nombre del destinatario para el saludo
    const nombreDestinatario = toEmail.split('@')[0];
    
    // Crear un mensaje de prueba con texto plano
    const mensajePrueba = `
Hola ${nombreDestinatario},

Este es un mensaje de prueba enviado desde PRL Conecta.

Información del sistema:
- Fecha de envío: ${fechaFormateada}
- Remitente: PRL Conecta
- Estado: Funcionando correctamente

Saludos cordiales,
Equipo PRL Conecta
    `;
    
    // Parámetros usando los nombres de variables que espera el template
    const templateParams = {
      email_to: toEmail.trim(),
      name: 'PRL Conecta',
      date: fechaFormateada,
      message: mensajePrueba,
      subject: 'Prueba de Template EmailJS',
      title: 'Prueba de Template EmailJS'
    };
    
    console.log('Enviando correo de prueba...');
    
    // Enviar directamente con emailjs
    const response = await emailjs.send(
      CONFIG.serviceId,
      CONFIG.templateId,
      templateParams
    );
    
    console.log('Correo de prueba enviado exitosamente:', response);
    return response;
  } catch (error) {
    // Mostrar detalles completos del error
    if (error.text) {
      console.error(`Error detallado de EmailJS: ${error.text}`);
    }
    
    if (error.status) {
      console.error(`Estado del error: ${error.status}`);
    }
    
    console.error('Error completo al enviar correo de prueba:', error);
    throw error;
  }
}

// Actualizar la función sendEmail para que use la misma lógica que funciona en incidencias
async function sendEmail(to: string[], subject: string, reportText: string) {
  try {
    const [toEmail] = to;
    
    // Validar email
    if (!toEmail || !validateEmail(toEmail)) {
      throw new Error(`El email del destinatario '${toEmail}' no es válido o está vacío`);
    }
    
    console.log(`Enviando email a: ${toEmail}`);
    
    // Formatear la fecha para el título
    const fechaFormateada = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    // Generar el mensaje completo como texto preformateado
    const mensajeCompleto = `
Estimado/a usuario,

A continuación se detalla el reporte de incidencias:

${reportText}

Para más detalles, acceda al sistema de gestión de incidencias.

Saludos,
Equipo PRL Conecta
    `;
    
    // Parámetros para el template de EmailJS
    const templateParams = {
      email_to: toEmail.trim(),
      name: 'PRL Conecta',
      date: fechaFormateada,
      message: mensajeCompleto,
      subject: subject,
      title: subject
    };
    
    console.log('Enviando email...');
    
    // Enviar directamente con emailjs, sin usar el hook
    const response = await emailjs.send(
      CONFIG.serviceId,
      CONFIG.templateId,
      templateParams
    );
    
    console.log('Email enviado correctamente:', response);
    return response;
  } catch (error) {
    // Manejo de errores similar al de useEmailJS
    if (error.status === 422) {
      if (error.text?.includes("recipients address is empty")) {
        console.error(`Error: La dirección de correo no fue reconocida por EmailJS.`);
      } else if (error.text?.includes("no template")) {
        console.error(`La plantilla '${CONFIG.templateId}' no existe o no es accesible.`);
      } else {
        console.error(`EmailJS rechazó la solicitud: ${error.text}`);
      }
    } else if (error.status === 401 || error.status === 403) {
      console.error(`Error de autenticación en EmailJS. Verifique su clave pública.`);
    } else if (error.status === 429) {
      console.error(`Se ha excedido el límite de solicitudes a EmailJS.`);
    }
    
    console.error('Error completo al enviar email con EmailJS:', error);
    throw error;
  }
}

function generateEmailTemplate(issues: IssueData[], isPersonalized: boolean): string {
  // Usamos texto plano en lugar de HTML
  const title = isPersonalized ? 'Reporte de Incidencias Asignadas' : 'Reporte Completo de Incidencias';
  
  // Texto plano simple
  let message = '';
  
  // Si no hay incidencias
  if (!issues || issues.length === 0) {
    message += 'No hay incidencias pendientes en este momento.';
  } else {
    // Añadimos cada incidencia como texto plano
    issues.forEach((issue, index) => {
      // Comprobamos que los campos existan o usamos valores por defecto
      const issueTitle = issue.title || 'Incidencia sin título';
      const issueStatus = issue.status || 'Sin estado';
      const responsable = issue.responsable || 'No asignado';
      
      // Formatear fecha correctamente
      let fechaCreacion = 'Fecha desconocida';
      try {
        if (issue.created_at) {
          const fecha = new Date(issue.created_at);
          if (!isNaN(fecha.getTime())) {
            fechaCreacion = fecha.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            });
          }
        }
      } catch (error) {
        console.error('Error al formatear fecha:', error);
      }
      
      // Formato simple de una sola línea para cada campo
      message += `- INCIDENCIA: ${issueTitle}\n`;
      message += `  Estado: ${issueStatus}\n`;
      message += `  Responsable: ${responsable}\n`;
      message += `  Fecha: ${fechaCreacion}\n`;
      
      // Espacio adicional entre incidencias
      if (index < issues.length - 1) {
        message += '\n';
      }
    });
  }
  
  return message;
}

// Función para verificar la configuración de EmailJS
export function verifyEmailJSConfig() {
  const info = {
    serviceId: SERVICE_ID,
    templateId: TEMPLATE_ID,
    publicKey: PUBLIC_KEY ? PUBLIC_KEY.substring(0, 4) + '...' : 'No definido',
    initialized: !!emailjs.init
  };
  
  console.log('Configuración de EmailJS:', info);
  console.log('Verifique que estos valores coincidan con su cuenta de EmailJS en dashboard.emailjs.com');
  
  return info;
}
