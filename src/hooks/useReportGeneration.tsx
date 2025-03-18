
import { useState } from 'react';
import { useEmailJS } from "@/hooks/useEmailJS";
import { useToast } from "@/hooks/use-toast";
import { getResponsibleEmails, sendReportViaEdgeFunction } from '@/utils/emailUtils';

export const useReportGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { sendEmail, isLoading } = useEmailJS();
  const { toast } = useToast();
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'available' | 'unavailable' | 'error' | undefined>(undefined);
  const [alternativeMethod, setAlternativeMethod] = useState<'emailjs' | 'edge'>('emailjs');

  // Function to retry report generation
  const retryGenerateReport = async () => {
    setRetryCount(prev => prev + 1);
    await handleGenerateReport();
  };

  // Toggle sending method
  const toggleSendMethod = () => {
    setAlternativeMethod(prev => prev === 'emailjs' ? 'edge' : 'emailjs');
    setRetryCount(0);
    setLastSendStatus(null);
    setDetailedError(null);
  };

  const handleGenerateReport = async () => {
    if (isGenerating || isLoading) return;
    
    try {
      setIsGenerating(true);
      setLastSendStatus(null);
      setDetailedError(null);
      
      toast({
        title: "Generando reporte",
        description: `Preparando reporte ${alternativeMethod === 'edge' ? 'usando función Edge' : 'via EmailJS'}...`,
      });

      if (alternativeMethod === 'edge') {
        // Use Edge function to send the report
        const response = await sendReportViaEdgeFunction();
        
        setLastSendStatus({
          success: response.success,
          message: response.success 
            ? `Reporte enviado correctamente a ${response.recipients?.length || 0} destinatarios.` 
            : `Error: ${response.message || 'No se pudo enviar el reporte'}`
        });
        
        if (!response.success && response.error) {
          setDetailedError(response.error.message || JSON.stringify(response.error));
        }
        
        if (response.success) {
          toast({
            title: "Reporte enviado",
            description: `Se ha enviado el reporte a ${response.recipients?.length || 0} destinatario(s) exitosamente`
          });
        } else {
          throw new Error(response.message || 'Error al generar el reporte');
        }
      } else {
        // Original method with EmailJS
        // Get responsible emails
        const responsibleEmails = await getResponsibleEmails();
        console.log('Valid emails for sending:', responsibleEmails);

        // Format current date in Spanish for the email
        const currentDate = new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        // Send to each responsible person
        let successCount = 0;
        let errorCount = 0;
        let lastError = null;

        for (const email of responsibleEmails) {
          try {
            // Re-verify that the email is valid just before sending
            if (!email || typeof email !== 'string' || !email.includes('@')) {
              console.error('Invalid email detected:', email);
              errorCount++;
              continue;
            }

            // Prepare parameters for EmailJS - without cleaning/modifying the email
            const templateParams = {
              to_name: "Responsable de Incidencias",
              to_email: email,  // Use the email as is without trim or modifications
              from_name: "Sistema de Incidencias",
              date: currentDate,
              message: `Reporte automático de incidencias pendientes generado el ${currentDate}. Por favor, revise el panel de control para obtener información detallada.`,
            };
            
            // Send via EmailJS using the specific template for reports
            await sendEmail(
              {
                serviceId: 'service_yz5opji',
                templateId: 'template_ddq6b3h', // Specific template for reports
                publicKey: 'RKDqUO9tTPGJrGKLQ',
              },
              templateParams
            );
            
            successCount++;
            console.log(`Email sent successfully to ${email}`);
          } catch (error: any) {
            console.error(`Error sending to ${email}:`, error);
            lastError = error;
            errorCount++;
          }
        }

        if (successCount > 0) {
          setLastSendStatus({
            success: true,
            message: `Se ha enviado el reporte a ${successCount} destinatario(s) exitosamente${errorCount > 0 ? `. ${errorCount} envíos fallaron.` : ''}`
          });
          
          toast({
            title: "Reporte enviado",
            description: `Se ha enviado el reporte a ${successCount} destinatario(s) exitosamente${errorCount > 0 ? `. ${errorCount} envíos fallaron.` : ''}`
          });
        } else {
          const errorMessage = `No se pudo enviar ningún reporte. ${lastError?.message || 'Revisar la consola para más detalles.'}`;
          
          setLastSendStatus({
            success: false,
            message: errorMessage
          });
          
          if (lastError) {
            setDetailedError(lastError instanceof Error ? lastError.message : JSON.stringify(lastError));
          }
          
          throw new Error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error("Error generating/sending the report:", error);
      
      if (!lastSendStatus) {
        setLastSendStatus({
          success: false,
          message: error instanceof Error ? error.message : "No se pudo generar o enviar el reporte"
        });
      }
      
      if (!detailedError) {
        setDetailedError(error instanceof Error ? error.stack || error.message : JSON.stringify(error));
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar o enviar el reporte",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    isLoading,
    lastSendStatus,
    detailedError,
    retryCount,
    connectionStatus,
    alternativeMethod,
    setConnectionStatus,
    retryGenerateReport,
    toggleSendMethod,
    handleGenerateReport
  };
};
