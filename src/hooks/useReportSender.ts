import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { sendReportWithEmailJS } from '@/services/emailService';

export const useReportSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const { toast } = useToast();

  const sendReport = async (filtered: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Enviando reporte",
        description: "Procesando solicitud...",
      });
      
      const result = await sendReportWithEmailJS(filtered);
      
      setLastResponse(result);
      
      if (result.success) {
        const { successCount = 0 } = result.stats;
        
        if (successCount === 0) {
          throw new Error("No se pudo enviar el reporte a ningún destinatario. Verifica que existan incidencias con responsable y correo asignados.");
        }
        
        toast({
          title: "Reporte enviado",
          description: `Se ha enviado el reporte a ${successCount} destinatario(s) exitosamente`,
        });
        
        return result;
      } else {
        throw new Error(result.message || 'No se pudo enviar el reporte');
      }
    } catch (err: any) {
      console.error("Error al enviar reporte:", err);
      
      setError(err.message || 'Error desconocido al enviar el reporte');
      
      toast({
        title: "Error",
        description: err.message || "No se pudo enviar el reporte",
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
    lastResponse
  };
};
