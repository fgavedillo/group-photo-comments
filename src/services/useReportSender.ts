
import { useState } from 'react';
import { callApi, ApiResponse } from './api/apiClient';
import { useToast } from '@/hooks/use-toast';

export function useReportSender() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  const sendReport = async (filtered: boolean = false, useResend: boolean = false) => {
    try {
      setIsLoading(true);
      
      const result = await callApi({
        url: useResend ? '/send-resend-report' : '/send-report',
        method: 'POST',
        data: { filtered }
      });
      
      setResponse(result);
      
      if (result.success) {
        toast({
          title: "Reporte enviado",
          description: `Se ha enviado el reporte con éxito`,
        });
        return result;
      } else {
        throw new Error(result.error?.message || 'No se pudo enviar el reporte');
      }
    } catch (err: any) {
      console.error("Error al enviar reporte:", err);
      setError(err.message || 'Error desconocido al enviar el reporte');
      
      toast({
        title: "Error",
        description: err.message || 'Error desconocido al enviar el reporte',
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
    response
  };
}
