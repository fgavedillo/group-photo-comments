
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendManualEmail } from "@/services/emailService";

export const useEmailSender = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiltered, setIsSendingFiltered] = useState(false);
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  const handleSendEmail = async (filtered: boolean = false) => {
    try {
      // Clear previous state
      setLastSendStatus(null);
      setDetailedError(null);
      
      if (filtered) {
        setIsSendingFiltered(true);
      } else {
        setIsSending(true);
      }
      
      const response = await sendManualEmail(filtered);
      
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
        description: `Se ha enviado el correo programado ${filtered ? 'filtrado por usuario' : 'completo'} con éxito`
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
        variant: "destructive"
      });
    } finally {
      if (filtered) {
        setIsSendingFiltered(false);
      } else {
        setIsSending(false);
      }
    }
  };

  return {
    isSending,
    isSendingFiltered,
    lastSendStatus,
    detailedError,
    handleSendEmail
  };
};
