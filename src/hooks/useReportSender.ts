
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { callApi } from '@/services/api/apiClient';
import { useIssues } from '@/hooks/useIssues';
import { sendReport } from '@/services/reportSender';

export const useReportSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [useResend, setUseResend] = useState(true); 
  const { toast } = useToast();
  const { issues } = useIssues();

  // Función para cambiar entre métodos de envío
  const toggleSendMethod = () => {
    setUseResend(prev => !prev);
    toast({
      title: "Método de envío cambiado",
      description: `Ahora usando: ${!useResend ? 'Resend Dashboard' : 'EmailJS'}`,
    });
  };

  // Función principal para enviar reportes
  const sendEmailReport = async (filtered: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Preparando reporte",
        description: `Creando reporte ${useResend ? 'dashboard' : 'email'} con ${useResend ? 'Resend' : 'EmailJS'}...`,
      });
      
      console.log(`Iniciando proceso de envío usando ${useResend ? 'Resend' : 'EmailJS'} (${filtered ? 'filtrado' : 'completo'})`);
      
      if (!issues || issues.length === 0) {
        throw new Error("No hay incidencias disponibles para incluir en el reporte");
      }
      
      console.log(`Total de incidencias disponibles para el reporte: ${issues.length}`);
      
      if (useResend) {
        // Generar un ID único de solicitud para seguimiento
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`[${requestId}] Iniciando solicitud a función Edge para el reporte dashboard`);
        
        // Obtener una lista de destinatarios (normalmente vendría del estado de la aplicación o una consulta a la base de datos)
        const recipients = ["avedillo81@gmail.com", "ejemplo@email.com"]; // Ejemplo de destinatarios
        
        // Llamar a la función sendReport con los datos necesarios
        const response = await sendReport(recipients, { 
          generateDashboard: true,
          timestamp: new Date().toISOString(),
          filtered: filtered,
          issuesData: issues || []
        });
        
        console.log(`[${requestId}] Respuesta de la función Edge:`, response);
        setLastResponse(response);
        
        if (response.success) {
          toast({
            title: "Reporte enviado correctamente",
            description: "El reporte del dashboard ha sido enviado a los destinatarios.",
          });
          
          return response;
        } else {
          throw new Error(response.error || 'No se pudo enviar el reporte del dashboard');
        }
      } else {
        // Usar el servicio EmailJS existente
        const { sendManualEmail } = await import('@/services/emailService');
        const result = await sendManualEmail(filtered, false);
        setLastResponse(result);
        
        if (result.success) {
          toast({
            title: "Reporte enviado",
            description: `Reporte enviado correctamente con EmailJS`,
          });
          
          return result;
        } else {
          throw new Error(result.error?.message || 'No se pudo enviar el reporte');
        }
      }
    } catch (err: any) {
      console.error("Error al enviar reporte:", err);
      
      // Mensaje de error amigable basado en el tipo de error
      let friendlyError;
      
      if (err.message?.includes("NetworkError") || err.message?.includes("Failed to fetch")) {
        friendlyError = "Error de conexión. Verifique su conexión a internet y que la función Edge esté correctamente desplegada.";
      } else if (err.message?.includes("404")) {
        friendlyError = "Función Edge no encontrada. Asegúrese de que está correctamente desplegada en Supabase.";
      } else if (err.message?.includes("CORS")) {
        friendlyError = "Error CORS. El servidor no está permitiendo solicitudes desde este origen.";
      } else {
        friendlyError = err.message || 'Error desconocido al enviar el reporte';
      }
      
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
    sendReport: sendEmailReport,
    isLoading,
    error,
    lastResponse,
    useResend,
    toggleSendMethod
  };
};
