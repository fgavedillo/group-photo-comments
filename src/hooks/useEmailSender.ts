
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendManualEmail } from "@/services/emailService";

export const useEmailSender = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiltered, setIsSendingFiltered] = useState(false);
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastSendConfiguration, setLastSendConfiguration] = useState<{filtered: boolean} | null>(null);
  const [maxRetries] = useState<number>(3);
  
  const resetStatus = useCallback(() => {
    setLastSendStatus(null);
    setDetailedError(null);
    setLastRequestId(null);
  }, []);
  
  // Added a function to check Edge Function availability
  const checkEdgeFunctionStatus = useCallback(async () => {
    try {
      // Make a lightweight ping to the Edge Function
      const response = await fetch("https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email", {
        method: "OPTIONS",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      console.log("Edge Function status check:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error checking Edge Function status:", error);
      return false;
    }
  }, []);
  
  // Call this function on component mount
  useEffect(() => {
    checkEdgeFunctionStatus().then(isAvailable => {
      console.log("Edge Function availability:", isAvailable ? "✅ Available" : "❌ Not available");
    });
  }, [checkEdgeFunctionStatus]);
  
  const handleRetry = useCallback(() => {
    if (lastSendConfiguration && retryCount < maxRetries) {
      handleSendEmail(lastSendConfiguration.filtered, true);
    }
  }, [retryCount, lastSendConfiguration, maxRetries]);
  
  const handleSendEmail = useCallback(async (filtered: boolean = false, isRetry: boolean = false) => {
    // Reset retry count for new requests
    if (!isRetry) {
      resetStatus();
      setRetryCount(0);
      // Save configuration for potential retries
      setLastSendConfiguration({ filtered });
    } else {
      // For retries, increment the count
      setRetryCount(prev => prev + 1);
    }
    
    // Set loading state
    if (filtered) {
      setIsSendingFiltered(true);
    } else {
      setIsSending(true);
    }
    
    try {
      console.log(`Starting email send (${filtered ? 'filtered' : 'full'}) - Retry ${retryCount}`);
      
      // Ping the edge function status before sending
      const isEdgeFunctionAvailable = await checkEdgeFunctionStatus();
      if (!isEdgeFunctionAvailable) {
        console.warn("Edge Function may not be available. Continuing anyway...");
      }
      
      // Send the email
      const response = await sendManualEmail(filtered);
      
      // Store request ID if available
      if (response.data?.requestId || response.error?.context?.requestId) {
        setLastRequestId(response.data?.requestId || response.error?.context?.requestId);
      }
      
      if (!response.success) {
        // Store error details if available
        if (response.error?.details) {
          setDetailedError(response.error.details);
        }
        
        throw new Error(response.error?.message || "Error desconocido");
      }
      
      // Store success
      setLastSendStatus({
        success: true,
        message: `Se ha enviado el correo programado ${filtered ? 'filtrado por usuario' : 'completo'} con éxito`
      });
      
      // Reset retry count on success
      setRetryCount(0);
      
      toast({
        title: "Correo enviado",
        description: `Se ha enviado el correo programado ${filtered ? 'filtrado por usuario' : 'completo'} con éxito`,
        duration: 5000
      });
    } catch (error) {
      console.error('Error al enviar correo:', error);
      
      // Store error
      setLastSendStatus({
        success: false,
        message: `Error: ${error.message || 'No se pudo enviar el correo programado'}`
      });
      
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo programado",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      if (filtered) {
        setIsSendingFiltered(false);
      } else {
        setIsSending(false);
      }
    }
  }, [toast, resetStatus, retryCount, checkEdgeFunctionStatus]);

  return {
    isSending,
    isSendingFiltered,
    lastSendStatus,
    detailedError,
    lastRequestId,
    retryCount,
    handleSendEmail,
    handleRetry,
    resetStatus,
    checkEdgeFunctionStatus
  };
};
