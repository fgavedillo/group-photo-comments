
import { supabase } from '../lib/supabaseClient';

export interface EmailQueueItem {
  to: string[];
  subject: string;
  html: string;
  scheduledFor: Date;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
}

export async function queueEmail(emailData: EmailQueueItem) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        to_addresses: emailData.to,
        subject: emailData.subject,
        html_content: emailData.html,
        scheduled_for: emailData.scheduledFor.toISOString(),
        is_periodic: emailData.isRecurring || false,
        period_type: emailData.recurringType || null,
        status: 'pending'
      })
      .select();

    if (error) {
      console.error("Error al encolar email:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error al encolar email:", error);
    throw error;
  }
}

export async function getQueuedEmails() {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error("Error al obtener emails encolados:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error al obtener emails encolados:", error);
    throw error;
  }
}
