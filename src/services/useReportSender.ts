
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useReportSender() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [useResend, setUseResend] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const { toast } = useToast();

  const sendReport = async (filtered: boolean = false) => {
    try {
      setIsLoading(true);
      
      // Funcionalidad de envío de correos deshabilitada
      console.log("La funcionalidad de envío de correos ha sido deshabilitada");
      
      setError("La funcionalidad de envío de correos ha sido deshabilitada");
      
      toast({
        title: "Funcionalidad deshabilitada",
        description: "El envío de correos ha sido deshabilitado temporalmente",
        variant: "destructive"
      });
      
      throw new Error("La funcionalidad de envío de correos ha sido deshabilitada");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || 'Error desconocido');
      
      toast({
        title: "Error",
        description: err.message || 'Error desconocido',
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSendMethod = () => {
    setUseResend(!useResend);
  };

  return {
    sendReport,
    isLoading,
    error,
    lastResponse,
    useResend,
    toggleSendMethod,
    recipientCount
  };
}
