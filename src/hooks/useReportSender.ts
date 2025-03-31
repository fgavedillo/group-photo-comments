
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { callApi } from '@/services/api/apiClient';
import { useIssues } from '@/hooks/useIssues';
import { sendReport } from '@/services/reportSender';
import { getResponsibleEmails } from '@/utils/emailUtils';

export const useReportSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [useResend, setUseResend] = useState(true); 
  const [recipientCount, setRecipientCount] = useState(0);
  const { toast } = useToast();
  const { issues } = useIssues();

  // Cargar la cantidad de destinatarios disponibles al iniciar
  useEffect(() => {
    const loadRecipientCount = async () => {
      try {
        const emails = await getResponsibleEmails();
        setRecipientCount(emails.length);
      } catch (err) {
        console.error("Error al obtener el conteo de destinatarios:", err);
      }
    };
    
    loadRecipientCount();
  }, []);

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
      // Obtener los emails de los responsables para verificar si hay destinatarios
      const responsibleEmails = await getResponsibleEmails();
      console.log("Emails de responsables disponibles:", responsibleEmails);
      
      if (!responsibleEmails || responsibleEmails.length === 0) {
        throw new Error("No se encontraron responsables con correos electrónicos válidos para enviar el reporte");
      }
      
      setRecipientCount(responsibleEmails.length);
      
      toast({
        title: "Preparando reporte",
        description: `Creando reporte ${filtered ? 'personalizado' : 'completo'} con ${useResend ? 'Resend' : 'EmailJS'} para ${responsibleEmails.length} destinatarios...`,
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
        
        // Obtener una lista de destinatarios
        const recipients = responsibleEmails;
        console.log(`[${requestId}] Enviando a ${recipients.length} destinatarios:`, recipients);
        
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
          // Extraer datos para el mensaje dependiendo de si estamos en modo de prueba
          const recipientInfo = response.data?.recipients ? 
            `${response.data.recipients.length} destinatarios previstos` : 
            "destinatarios configurados";
            
          const testModeInfo = response.data?.testMode ? 
            " (modo de prueba - enviado solo al correo verificado)" : 
            "";
            
          const senderInfo = response.data?.senderDetails ? 
            `\nRemitente: ${response.data.senderDetails.name} <${response.data.senderDetails.email}>` : 
            "";
          
          toast({
            title: "Reporte enviado correctamente",
            description: `El reporte ha sido enviado a ${recipientInfo}${testModeInfo}.${senderInfo}`,
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
          // La propiedad recipients podría no existir en esta respuesta
          const recipientCount = result.data?.stats?.totalEmails || "varios";
          
          toast({
            title: "Reporte enviado",
            description: `Reporte enviado correctamente con EmailJS a ${recipientCount} destinatarios`,
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
      } else if (err.message?.includes("You can only send testing emails")) {
        friendlyError = "Error de Resend: Solo puedes enviar emails de prueba a tu propio correo verificado. Por favor, verifica un dominio en resend.com/domains.";
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
    toggleSendMethod,
    recipientCount
  };
};
