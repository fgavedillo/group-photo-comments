
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { sendManualEmail } from '@/services/emailService';

export const useReportSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [useResend, setUseResend] = useState(false);
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
      
      const result = await sendManualEmail(filtered, useResend);
      
      console.log('Resultado de envío de reporte:', result);
      
      setLastResponse(result);
      
      if (result.success) {
        const { successCount = 0 } = result.data?.stats || {};
        
        if (successCount === 0) {
          throw new Error("No se pudo enviar el reporte a ningún destinatario. Verifica que existan incidencias con responsable y correo asignados.");
        }
        
        toast({
          title: "Reporte enviado",
          description: `Se ha enviado el reporte con ${useResend ? 'Resend' : 'EmailJS'} a ${successCount} destinatario(s) exitosamente`,
        });
        
        return result;
      } else {
        throw new Error(result.error?.message || 'No se pudo enviar el reporte');
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
