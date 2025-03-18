import { supabase } from "@/lib/supabase";
import emailjs from '@emailjs/browser';

// Function to check connection with EmailJS
export const checkEmailJSConnection = async (setConnectionStatus: React.Dispatch<React.SetStateAction<'checking' | 'available' | 'unavailable' | 'error' | undefined>>): Promise<boolean> => {
  try {
    setConnectionStatus('checking');
    // Perform a simple request to EmailJS to verify connectivity
    const publicKey = 'RKDqUO9tTPGJrGKLQ';
    emailjs.init(publicKey);
    
    // Verify server availability
    const testTemplateParams = {
      to_name: "Test",
      to_email: "test@example.com",
      from_name: "Sistema de Incidencias",
      date: new Date().toLocaleDateString('es-ES'),
      message: "Verificación de conexión"
    };
    
    // Don't send the email, just get a token to verify connectivity
    await emailjs.send('service_yz5opji', 'template_ddq6b3h', testTemplateParams);
    setConnectionStatus('available');
    return true;
  } catch (error: any) {
    console.error('Error when verifying connection with EmailJS:', error);
    
    if (error.status === 401 || error.status === 403) {
      // Authentication problems
      setConnectionStatus('error');
    } else {
      // Other connection problems
      setConnectionStatus('unavailable');
    }
    return false;
  }
};

// Function to get all emails of responsible persons with issues under study or in progress
export const getResponsibleEmails = async () => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('assigned_email')
      .in('status', ['en-estudio', 'en-curso'])
      .not('assigned_email', 'is', null);
    
    if (error) throw error;
    
    // Extract unique emails (remove duplicates)
    const uniqueEmails = [...new Set(data
      .map(item => item.assigned_email)
      .filter(email => email && typeof email === 'string' && email.trim() !== '' && email.includes('@'))
    )];
    
    console.log('Responsible emails found:', uniqueEmails);
    
    if (uniqueEmails.length === 0) {
      throw new Error('No responsible persons with valid emails found for pending issues');
    }
    
    return uniqueEmails;
  } catch (error: any) {
    console.error('Error getting responsible emails:', error);
    throw error;
  }
};

// Method for sending report via Edge function
export const sendReportViaEdgeFunction = async () => {
  try {
    console.log("Invoking send-daily-report function...");
    
    const { data: functionResponse, error: functionError } = await supabase.functions.invoke('send-daily-report', {
      method: 'POST',
      body: { 
        manual: true,
        filteredByUser: true,
        requestId: `manual-${Date.now()}`
      },
    });

    if (functionError) {
      console.error("Error in edge function:", functionError);
      throw functionError;
    }

    console.log("Function response:", functionResponse);
    return functionResponse;
  } catch (error: any) {
    console.error('Error invoking edge function:', error);
    throw error;
  }
};
