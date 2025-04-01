
import supabase from "@/lib/supabaseClient";

/**
 * Interface for email queue entry
 */
export interface QueuedEmail {
  id?: string;
  to: string[];
  subject: string;
  html: string;
  scheduledFor?: Date;
  status?: 'pending' | 'sent' | 'failed';
  created_at?: string;
  updated_at?: string;
  error?: string;
  user_id?: string;
}

/**
 * Adds an email to the queue for sending
 */
export async function queueEmail(email: QueuedEmail) {
  try {
    console.log('Encolando email para:', email.to);
    
    // Validar que tenga destinatarios
    if (!email.to || email.to.length === 0) {
      throw new Error('Se requiere al menos un destinatario para encolar el email');
    }
    
    // Crear objeto para insertar
    const queueEntry = {
      to: email.to,
      subject: email.subject,
      html: email.html,
      status: 'pending',
      scheduled_for: email.scheduledFor || new Date(),
    };
    
    // Insertar en tabla
    const { data, error } = await supabase
      .from('email_queue')
      .insert(queueEntry)
      .select()
      .single();
    
    if (error) {
      console.error('Error al encolar email:', error);
      throw new Error(`Error al encolar email: ${error.message}`);
    }
    
    console.log('Email encolado exitosamente:', data);
    return {
      success: true,
      message: 'Email encolado exitosamente',
      data
    };
  } catch (error) {
    console.error('Error en queueEmail:', error);
    throw error;
  }
}

/**
 * Obtener emails pendientes de enviar
 */
export async function getPendingEmails() {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });
    
    if (error) {
      console.error('Error al obtener emails pendientes:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getPendingEmails:', error);
    throw error;
  }
}

/**
 * Marcar un email como enviado
 */
export async function markEmailAsSent(id: string) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al marcar email ${id} como enviado:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error en markEmailAsSent:', error);
    throw error;
  }
}

/**
 * Marcar un email como fallido
 */
export async function markEmailAsFailed(id: string, errorMessage: string) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .update({
        status: 'failed',
        error: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al marcar email ${id} como fallido:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error en markEmailAsFailed:', error);
    throw error;
  }
}

/**
 * Procesar emails pendientes manualmente
 */
export async function processEmailQueue() {
  try {
    // Llamar a la función Edge para procesar la cola
    const { data, error } = await supabase.functions.invoke('process-email-queue');
    
    if (error) {
      console.error('Error al procesar cola de emails:', error);
      throw new Error(`Error al procesar cola: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error en processEmailQueue:', error);
    throw error;
  }
}
