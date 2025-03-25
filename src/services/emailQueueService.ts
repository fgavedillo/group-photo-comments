import { getSupabaseClient } from '../lib/supabaseClient';

interface QueueEmailRequest {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  isPeriodic?: boolean;
  periodType?: 'daily' | 'weekly' | 'monthly';
  scheduledFor?: Date;
}

export const queueEmail = async (request: QueueEmailRequest) => {
  const supabase = getSupabaseClient();
  
  try {
    // Verificar que tenemos una sesión activa
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No hay sesión activa - por favor inicia sesión');
    }

    console.log('Session found:', !!session); // Debug log

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        to_addresses: request.to,
        cc_addresses: request.cc,
        subject: request.subject,
        html_content: request.html,
        is_periodic: request.isPeriodic || false,
        period_type: request.periodType,
        scheduled_for: request.scheduledFor || new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error de inserción:', error); // Debug log
      throw error;
    }

    return {
      success: true,
      message: 'Email añadido a la cola de envío',
      data
    };
  } catch (error) {
    console.error('Error completo:', error); // Debug log
    throw error;
  }
};

export const getQueueStatus = async (id: string) => {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener estado del email:', error);
    throw error;
  }
}; 