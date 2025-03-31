
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { callApi } from '@/services/api/apiClient';

export const useReportSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [useResend, setUseResend] = useState(true); 
  const { toast } = useToast();

  const toggleSendMethod = () => {
    setUseResend(prev => !prev);
    toast({
      title: "Send method changed",
      description: `Now using: ${!useResend ? 'Resend Dashboard' : 'EmailJS'}`,
    });
  };

  const sendReport = async (filtered: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Preparing report",
        description: `Creating ${useResend ? 'dashboard report' : 'email report'} with ${useResend ? 'Resend' : 'EmailJS'}...`,
      });
      
      console.log(`Starting sending process using ${useResend ? 'Resend' : 'EmailJS'} (${filtered ? 'filtered' : 'complete'})`);
      
      if (useResend) {
        // Generate a unique request ID for tracking
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`[${requestId}] Starting request to Edge Function for dashboard report`);
        
        // Import and use the sendReport function
        const { sendReport } = await import('@/services/reportSender');
        
        // Get a list of recipients (this would normally come from your app's state or a database query)
        const recipients = ["avedillo81@gmail.com"]; // Example recipient
        
        // Call the sendReport function with generateDashboard flag
        const response = await sendReport(recipients, { 
          generateDashboard: true,
          timestamp: new Date().toISOString(),
          filtered: filtered
        });
        
        console.log(`[${requestId}] Response from Edge Function:`, response);
        setLastResponse(response);
        
        if (response.success) {
          toast({
            title: "Report sent successfully",
            description: "The dashboard report has been sent to the recipients.",
          });
          
          return response;
        } else {
          throw new Error(response.error?.message || 'Could not send dashboard report');
        }
      } else {
        // Use existing EmailJS service
        const { sendManualEmail } = await import('@/services/emailService');
        const result = await sendManualEmail(filtered, false);
        setLastResponse(result);
        
        if (result.success) {
          toast({
            title: "Report sent",
            description: `Report successfully sent with EmailJS`,
          });
          
          return result;
        } else {
          throw new Error(result.error?.message || 'Could not send report');
        }
      }
    } catch (err: any) {
      console.error("Error sending report:", err);
      
      // Helpful error message based on the error type
      let friendlyError;
      
      if (err.message?.includes("NetworkError") || err.message?.includes("Failed to fetch")) {
        friendlyError = "Connection error. Check your internet connection and that the Edge Function is correctly deployed.";
      } else if (err.message?.includes("404")) {
        friendlyError = "Edge Function not found. Make sure it's correctly deployed in Supabase.";
      } else if (err.message?.includes("CORS")) {
        friendlyError = "CORS error. The server is not allowing requests from this origin.";
      } else {
        friendlyError = err.message || 'Unknown error sending report';
      }
      
      setError(friendlyError);
      
      toast({
        title: "Error",
        description: friendlyError,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendReport,
    isLoading,
    error,
    lastResponse,
    useResend,
    toggleSendMethod
  };
};
