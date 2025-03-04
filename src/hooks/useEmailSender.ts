
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendManualEmail } from "@/services/emailService";

export const useEmailSender = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiltered, setIsSendingFiltered] = useState(false);
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Máximo número de reintentos automáticos
  
  // Referencia para rastrear si el componente está montado
  const isMounted = useRef(true);

  // Actualizar la referencia cuando el componente se desmonte
  useState(() => {
    return () => {
      isMounted.current = false;
    };
  });

  const handleSendEmail = useCallback(async (filtered: boolean = false, isRetry: boolean = false) => {
    try {
      // Si es un reintento, incrementar el contador
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      } else {
        // Si no es reintento, reiniciar contador
        setRetryCount(0);
      }
      
      // Clear previous state only on first attempt
      if (!isRetry) {
        setLastSendStatus(null);
        setDetailedError(null);
        setLastRequestId(null);
      }
      
      // Set loading state
      if (filtered) {
        setIsSendingFiltered(true);
      } else {
        setIsSending(true);
      }
      
      // Send the email with improved timeout handling
      const response = await sendManualEmail(filtered);
      
      // Verificar si el componente sigue montado
      if (!isMounted.current) return;
      
      // Almacenar ID de solicitud para referencia
      if (response.data?.requestId || response.error?.context?.requestId) {
        setLastRequestId(response.data?.requestId || response.error?.context?.requestId);
      }
      
      if (!response.success) {
        // Store error details if available
        if (response.error?.details) {
          setDetailedError(response.error.details);
        }
        
        // Intentar nuevamente si es un error de red y no hemos excedido los reintentos
        const isNetworkError = 
          response.error?.code === 'CONNECTION_ERROR' || 
          response.error?.code === 'TIMEOUT_ERROR';
          
        if (isNetworkError && retryCount < maxRetries) {
          toast({
            title: "Reintentando conexión",
            description: `Intento ${retryCount + 1} de ${maxRetries + 1}`,
            duration: 3000
          });
          
          // Esperar un poco antes de reintentar (backoff exponencial)
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
          setTimeout(() => {
            if (isMounted.current) {
              handleSendEmail(filtered, true);
            }
          }, backoffTime);
          
          return;
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
      
      // Verificar si el componente sigue montado
      if (!isMounted.current) return;
      
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
      // Verificar si el componente sigue montado
      if (!isMounted.current) return;
      
      if (filtered) {
        setIsSendingFiltered(false);
      } else {
        setIsSending(false);
      }
    }
  }, [toast, retryCount]);

  return {
    isSending,
    isSendingFiltered,
    lastSendStatus,
    detailedError,
    lastRequestId,
    retryCount,
    handleSendEmail
  };
};
