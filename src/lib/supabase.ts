
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  type: string;
}

export const sendEmail = async (
  to: string, 
  subject: string, 
  content: string, 
  attachments?: Attachment[],
  from: string = "prevencionlingotes@gmail.com"
) => {
  try {
    console.log("Attempting to send email via Supabase function:", { to, subject, from });
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { 
        to, 
        subject, 
        content, 
        attachments,
        from
      }
    });

    if (error) {
      console.error("Supabase function error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error('Error in sendEmail function:', error);
    throw error;
  }
};
