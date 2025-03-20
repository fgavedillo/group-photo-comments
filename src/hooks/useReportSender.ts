
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
      // Mostrar toast de inicio
      toast({
        title: "Enviando reporte",
        description: "Procesando solicitud...",
      });
      
      // ID único para esta solicitud
      const requestId = `manual-${Date.now()}`;
      
      // Invocar la función Edge para enviar el reporte
      const { data, error: functionError } = await supabase.functions.invoke('send-daily-report', {
        method: 'POST',
        body: {
          manual: true,
          filteredByUser: filtered,
          requestId
        },
      });
      
      // Manejar errores de la función
      if (functionError) {
        console.error("Error en función Edge:", functionError);
        throw new Error(`Error en el servidor: ${functionError.message || 'No se pudo procesar la solicitud'}`);
      }
      
      // Guardar respuesta completa
      setLastResponse(data);
      
      // Verificar si el envío fue exitoso
      if (data && data.success) {
        const recipientCount = data.recipients?.length || 0;
        
        toast({
          title: "Reporte enviado",
          description: `Se ha enviado el reporte a ${recipientCount} destinatario(s) exitosamente`,
        });
        
        return data;
      } else {
        // Manejar errores en la respuesta
        const errorMsg = data?.message || 'No se pudo enviar el reporte';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error("Error al enviar reporte:", err);
      
      // Guardar mensaje de error
      setError(err.message || 'Error desconocido al enviar el reporte');
      
      // Mostrar toast de error
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
