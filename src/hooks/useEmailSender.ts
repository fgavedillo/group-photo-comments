
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendManualEmail, testEmailConnection } from "@/services/emailService";

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
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');
  
  const resetStatus = useCallback(() => {
    setLastSendStatus(null);
    setDetailedError(null);
    setLastRequestId(null);
  }, []);
  
  const checkEdgeFunctionStatus = useCallback(async () => {
    try {
      console.log("Verificando disponibilidad de la función Edge...");
      setConnectionStatus('checking');
      
      const result = await testEmailConnection();
      
      if (result.success && result.data?.success) {
        console.log("Verificación de estado de la función Edge:", {
          status: "OK",
          details: result.data.details
        });
        setConnectionStatus('available');
        return true;
      } else {
        console.error("Error verificando el estado de la función Edge:", 
          result.error?.message || "Error desconocido");
        setConnectionStatus('unavailable');
        return false;
      }
    } catch (error) {
      console.error("Error verificando el estado de la función Edge:", error);
      setConnectionStatus('error');
      return false;
    }
  }, []);
  
  useEffect(() => {
    // Verificar la disponibilidad de la función al montar el componente
    checkEdgeFunctionStatus().then(isAvailable => {
      console.log("Disponibilidad de la función Edge:", isAvailable ? "✅ Disponible" : "❌ No disponible");
    });
    
    // Verificar la disponibilidad cada 5 minutos
    const intervalId = setInterval(() => {
      checkEdgeFunctionStatus();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
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
        console.warn("La función Edge podría no estar disponible. Verificando antes de continuar...");
        
        toast({
          title: "Advertencia",
          description: "La función Edge no responde. Verificando conexión...",
          duration: 5000
        });
        
        // Intentar nuevamente verificar la función antes de continuar
        const secondCheck = await checkEdgeFunctionStatus();
        if (!secondCheck) {
          throw new Error("La función Edge no está disponible. Por favor, intente más tarde.");
        }
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
      
      // Determinar si es un error relacionado con credenciales
      const isCredentialError = 
        error.message?.includes("credenciales") || 
        error.message?.includes("Autenticación") ||
        error.message?.includes("contraseña") ||
        error.message?.includes("Username and Password");
      
      // Determinar si es un error de conexión
      const isConnectionError =
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network Error") ||
        error.message?.includes("no está disponible") ||
        error.message?.includes("conexión");
      
      let errorMessage = error.message || 'No se pudo enviar el correo';
      
      if (isCredentialError) {
        errorMessage = "Error de autenticación con Gmail. Verifique las credenciales en Supabase.";
      } else if (isConnectionError) {
        errorMessage = "Error de conexión. Verifique su red y la disponibilidad del servidor.";
      }
      
      setLastSendStatus({
        success: false,
        message: `Error: ${errorMessage}`
      });
      
      toast({
        title: "Error",
        description: errorMessage,
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
    connectionStatus,
    handleSendEmail,
    handleRetry,
    resetStatus,
    checkEdgeFunctionStatus
  };
};
