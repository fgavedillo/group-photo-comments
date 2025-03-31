
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
      description: `Now using: ${!useResend ? 'Resend' : 'EmailJS'}`,
    });
  };

  const sendReport = async (filtered: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Sending report",
        description: `Processing request with ${useResend ? 'Resend' : 'EmailJS'}...`,
      });
      
      console.log(`Starting sending process using ${useResend ? 'Resend' : 'EmailJS'} (${filtered ? 'filtered' : 'complete'})`);
      
      if (useResend) {
        // Generate a unique request ID for tracking
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`[${requestId}] Starting test request to Edge Function`);
        
        // Simple test sending to confirm the Edge Function is working
        const testResponse = await callApi({
          url: 'https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report',
          method: 'POST',
          data: { 
            to: ['test@example.com'],
            subject: 'Test Report',
            html: '<p>This is a test report</p>',
            filtered: filtered,
            requestId: requestId
          },
          config: {
            timeout: 10000 // 10 second timeout
          }
        });
        
        console.log(`[${requestId}] Response from Edge Function:`, testResponse);
        setLastResponse(testResponse);
        
        if (testResponse.success) {
          toast({
            title: "Test successful",
            description: "The connection to the email service is working. Implement full email sending next.",
          });
          
          return testResponse;
        } else {
          throw new Error(testResponse.error?.message || 'Could not send test report');
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
