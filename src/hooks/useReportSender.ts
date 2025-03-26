
import { useState } from "react";
import { sendReportWithResend } from "@/services/resendService";

interface ReportResponse {
  success: boolean;
  stats: {
    successCount: number;
    failureCount: number;
    totalEmails: number;
  };
  timestamp: string;
  error?: string;
}

export const useReportSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ReportResponse | null>(null);
  
  const sendReport = async (filteredByUser: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Iniciando envío de reportes${filteredByUser ? ' personalizados' : ''}...`);
      
      // Llamar al servicio de envío de reportes que utiliza Resend
      const response = await sendReportWithResend(filteredByUser);
      
      console.log('Respuesta del servicio de envío:', response);
      setLastResponse(response);
      
      return response;
    } catch (error: any) {
      console.error('Error en useReportSender:', error);
      
      const errorMessage = error.error || error.message || 'Error desconocido al enviar reporte';
      setError(errorMessage);
      
      // Propagar el error para manejarlo en el componente si es necesario
      throw new Error(errorMessage);
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
