
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
  
  const checkEdgeFunctionStatus = useCallback(async () => {
    try {
      console.log("Verificando disponibilidad de la función Edge...");
      const response = await fetch("https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email", {
        method: "OPTIONS",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      console.log("Verificación de estado de la función Edge:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error verificando el estado de la función Edge:", error);
      return false;
    }
  }, []);
  
  useEffect(() => {
    checkEdgeFunctionStatus().then(isAvailable => {
      console.log("Disponibilidad de la función Edge:", isAvailable ? "✅ Disponible" : "❌ No disponible");
    });
  }, [checkEdgeFunctionStatus]);
  
  const handleRetry = useCallback(() => {
    if (lastSendConfiguration && retryCount < maxRetries) {
      handleSendEmail(lastSendConfiguration.filtered, true);
    }
  }, [retryCount, lastSendConfiguration, maxRetries]);
  
  const handleSendEmail = useCallback(async (filtered: boolean = false, isRetry: boolean = false) => {
    if (!isRetry) {
      resetStatus();
      setRetryCount(0);
      setLastSendConfiguration({ filtered });
    } else {
      setRetryCount(prev => prev + 1);
    }
    
    if (filtered) {
      setIsSendingFiltered(true);
    } else {
      setIsSending(true);
    }
    
    try {
      console.log(`Iniciando envío de correo (${filtered ? 'filtrado' : 'completo'}) - Intento ${retryCount}`);
      
      const isEdgeFunctionAvailable = await checkEdgeFunctionStatus();
      if (!isEdgeFunctionAvailable) {
        console.warn("La función Edge podría no estar disponible. Continuando de todos modos...");
      }
      
      const response = await sendManualEmail(filtered);
      
      if (response.data?.requestId || response.error?.context?.requestId) {
        setLastRequestId(response.data?.requestId || response.error?.context?.requestId);
      }
      
      if (!response.success) {
        if (response.error?.details) {
          setDetailedError(response.error.details);
        }
        
        throw new Error(response.error?.message || "Error desconocido");
      }
      
      const successMessage = filtered 
        ? "Se ha enviado el correo personalizado con las incidencias asignadas a cada usuario"
        : "Se ha enviado el correo programado completo con éxito";
      
      setLastSendStatus({
        success: true,
        message: successMessage
      });
      
      setRetryCount(0);
      
      const recipientCount = response.data?.recipients?.length || 0;
      const recipientInfo = recipientCount > 0 ? ` a ${recipientCount} destinatarios` : "";
      
      toast({
        title: "Correo enviado correctamente",
        description: `${successMessage}${recipientInfo}`,
        duration: 5000
      });
    } catch (error) {
      console.error('Error al enviar correo:', error);
      
      setLastSendStatus({
        success: false,
        message: `Error: ${error.message || 'No se pudo enviar el correo'}`
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
