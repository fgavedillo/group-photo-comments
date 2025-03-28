
import { callApi } from './api/apiClient';
import supabase from '../lib/supabaseClient';

export interface EmailQueueItem {
  to: string[];
  subject: string;
  html: string;
  scheduledFor?: Date;
  isRecurring?: boolean;
  recurringPattern?: string;
}

/**
 * Añade un email a la cola de envío
 */
export async function queueEmail(emailData: EmailQueueItem) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        to_addresses: emailData.to,
        subject: emailData.subject,
        html_content: emailData.html,
        scheduled_for: emailData.scheduledFor ? emailData.scheduledFor.toISOString() : new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al encolar el email:', error);
      throw error;
    }
    
    return {
      success: true,
      data: data,
      message: 'Email añadido a la cola de envío'
    };
  } catch (error) {
    console.error('Error en queueEmail:', error);
    return {
      success: false,
      error: error,
      message: 'Error al encolar el email'
    };
  }
}

/**
 * Obtiene los emails pendientes de la cola
 */
export async function getPendingEmails() {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error obteniendo emails pendientes:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Envia un email desde la cola
 */
export async function sendQueuedEmail(emailId: string) {
  try {
    // Actualizamos el estado mientras procesamos
    const { data: emailData, error: selectError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('id', emailId)
      .single();
    
    if (selectError) {
      throw selectError;
    }
    
    if (!emailData) {
      throw new Error(`No se encontró el email con ID ${emailId}`);
    }
    
    // Marcamos como en proceso
    await supabase
      .from('email_queue')
      .update({ status: 'processing' })
      .eq('id', emailId);
    
    // Realizamos el envío con la API adecuada
    const result = await callApi({
      url: '/send-email',
      method: 'POST',
      data: {
        to: emailData.to_addresses,
        subject: emailData.subject,
        html: emailData.html_content
      }
    });
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Error al enviar el email');
    }
    
    // Marcamos como enviado
    await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        processed_at: new Date().toISOString()
      })
      .eq('id', emailId);
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error enviando email desde cola:', error);
    
    // Marcamos como fallido
    await supabase
      .from('email_queue')
      .update({
        status: 'failed',
        error: error.message || 'Error desconocido',
        processed_at: new Date().toISOString()
      })
      .eq('id', emailId);
    
    return {
      success: false,
      error: error
    };
  }
}
