
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendManualEmail } from "@/services/emailService";

export const useEmailSender = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiltered, setIsSendingFiltered] = useState(false);
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  
  const handleSendEmail = useCallback(async (filtered: boolean = false) => {
    try {
      // Clear previous state
      setLastSendStatus(null);
      setDetailedError(null);
      setLastRequestId(null);
      
      // Set loading state
      if (filtered) {
        setIsSendingFiltered(true);
      } else {
        setIsSending(true);
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
  }, [toast]);

  return {
    isSending,
    isSendingFiltered,
    lastSendStatus,
    detailedError,
    lastRequestId,
    retryCount: 0, // Mantenemos el campo pero sin funcionalidad de reintento
    handleSendEmail
  };
};
