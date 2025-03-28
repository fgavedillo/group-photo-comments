
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { sendManualEmail } from '@/services/emailService';

export const useReportSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [useResend, setUseResend] = useState(true); // Default to using Resend
  const { toast } = useToast();

  const toggleSendMethod = () => {
    setUseResend(prev => !prev);
    toast({
      title: "Método de envío cambiado",
      description: `Ahora usando: ${!useResend ? 'Resend' : 'EmailJS'}`,
    });
  };

  const sendReport = async (filtered: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Enviando reporte",
        description: `Procesando solicitud con ${useResend ? 'Resend' : 'EmailJS'}...`,
      });
      
      console.log(`Iniciando proceso de envío usando ${useResend ? 'Resend' : 'EmailJS'} (${filtered ? 'filtrado' : 'completo'})`);
      
      // Usar la nueva función directamente para Resend
      if (useResend) {
        // Llamar directamente a la Edge Function
        const response = await fetch('https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filtered
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch (e) {
            errorMessage = errorText;
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        setLastResponse(result);
        
        if (result.success) {
          const { successCount = 0 } = result.data?.stats || {};
          
          if (successCount === 0) {
            throw new Error("No se pudo enviar el reporte a ningún destinatario. Verifica que existan incidencias con responsable y correo asignados.");
          }
          
          toast({
            title: "Reporte enviado",
            description: `Se ha enviado el reporte con Resend a ${successCount} destinatario(s) exitosamente`,
          });
          
          return result;
        } else {
          throw new Error(result.error?.message || 'No se pudo enviar el reporte');
        }
      } else {
        // Usar la función existente para EmailJS
        const result = await sendManualEmail(filtered, false);
        setLastResponse(result);
        
        if (result.success) {
          const { successCount = 0 } = result.data?.stats || {};
          
          if (successCount === 0) {
            throw new Error("No se pudo enviar el reporte a ningún destinatario. Verifica que existan incidencias con responsable y correo asignados.");
          }
          
          toast({
            title: "Reporte enviado",
            description: `Se ha enviado el reporte con EmailJS a ${successCount} destinatario(s) exitosamente`,
          });
          
          return result;
        } else {
          throw new Error(result.error?.message || 'No se pudo enviar el reporte');
        }
      }
    } catch (err) {
      console.error("Error al enviar reporte:", err);
      
      // Mensaje amigable que siempre indica verificar incidencias
      const friendlyError = err.message?.includes("NetworkError") ?
        "Error de conexión al enviar el reporte. Verifica tu conexión a internet y que la función Edge esté correctamente publicada." :
        err.message || 'Error desconocido al enviar el reporte';
      
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
