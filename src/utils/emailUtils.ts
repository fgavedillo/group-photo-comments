
import { supabase } from "@/lib/supabase";
import emailjs from '@emailjs/browser';

// Función para validar direcciones de correo electrónico
export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email || typeof email !== 'string') return false;
  email = email.trim();
  if (email === '') return false;
  
  // Validación básica de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para verificar conexión con EmailJS
export const checkEmailJSConnection = async (setConnectionStatus: React.Dispatch<React.SetStateAction<'checking' | 'available' | 'unavailable' | 'error' | undefined>>): Promise<boolean> => {
  try {
    setConnectionStatus('checking');
    // Inicializar EmailJS con la clave pública
    const publicKey = 'RKDqUO9tTPGJrGKLQ';
    emailjs.init(publicKey);
    
    // Usar un email de prueba que definitivamente sea válido para la prueba de conexión
    const testEmail = "test@example.com";
    
    // Verificar disponibilidad del servidor usando una dirección de prueba válida
    const testTemplateParams = {
      to_name: "Test",
      to_email: testEmail,
      from_name: "Sistema de Incidencias",
      date: new Date().toLocaleDateString('es-ES'),
      message: "Verificación de conexión"
    };
    
    // Solo verificar conexión sin enviar realmente un correo de prueba
    const connectionTest = await emailjs.send(
      'service_yz5opji', 
      'template_ddq6b3h', 
      testTemplateParams
    );
    
    console.log("Resultado de prueba de conexión:", connectionTest);
    setConnectionStatus('available');
    return true;
  } catch (error: any) {
    console.error('Error al verificar conexión con EmailJS:', error);
    
    if (error.status === 401 || error.status === 403) {
      // Problemas de autenticación
      setConnectionStatus('error');
    } else {
      // Otros problemas de conexión
      setConnectionStatus('unavailable');
    }
    return false;
  }
};

// Función para obtener todos los correos de responsables con incidencias en estudio o en curso
export const getResponsibleEmails = async () => {
  try {
    console.log("Obteniendo emails de responsables...");
    
    const { data, error } = await supabase
      .from('issues')
      .select('assigned_email')
      .in('status', ['en-estudio', 'en-curso'])
      .not('assigned_email', 'is', null);
    
    if (error) {
      console.error("Error SQL al obtener correos:", error);
      throw error;
    }
    
    console.log("Datos crudos de consulta:", data);
    
    // Extraer emails únicos con validación mejorada
    const uniqueEmails = [...new Set(data
      .map(item => item.assigned_email)
      .filter(email => isValidEmail(email))
      .map(email => email!.trim())
    )];
    
    console.log('Emails de responsables encontrados:', uniqueEmails);
    
    if (uniqueEmails.length === 0) {
      console.warn('No se encontraron responsables con correos electrónicos válidos para incidencias pendientes');
    }
    
    return uniqueEmails;
  } catch (error: any) {
    console.error('Error obteniendo emails de responsables:', error);
    throw error;
  }
};

// NUEVA FUNCIÓN: Enviar reporte a través de la función Edge de Supabase
export const sendReportViaEdgeFunction = async (filtered: boolean = false) => {
  try {
    console.log(`Iniciando envío de reporte a través de Edge Function (${filtered ? 'filtrado' : 'completo'})`);
    
    // Generar ID único para esta solicitud
    const requestId = `manual-${Date.now()}`;
    
    // Invocar la función Edge para enviar el reporte
    const { data, error } = await supabase.functions.invoke('send-daily-report', {
      method: 'POST',
      body: {
        manual: true,
        filteredByUser: filtered,
        requestId
      },
    });
    
    console.log("Respuesta de la función Edge:", data);
    
    if (error) {
      console.error("Error en función Edge:", error);
      throw error;
    }
    
    // Verificar si hay un problema con los destinatarios
    if (data && data.success && (!data.recipients || data.recipients.length === 0)) {
      if (data.stats && data.stats.failureCount > 0 && data.stats.successCount === 0) {
        throw new Error("No se pudo enviar el reporte a ningún destinatario. Verifica que existan responsables asignados a incidencias pendientes.");
      }
    }
    
    return data;
  } catch (error: any) {
    console.error("Error enviando reporte a través de Edge Function:", error);
    throw error;
  }
};
