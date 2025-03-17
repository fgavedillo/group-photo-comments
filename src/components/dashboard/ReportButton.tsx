
import { Button } from "@/components/ui/button";
import { FileImage, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useEmailJS } from "@/hooks/useEmailJS";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { EmailStatusAlerts } from "../email/EmailStatusAlerts";
import emailjs from '@emailjs/browser';

interface ReportButtonProps {
  dashboardRef: React.RefObject<HTMLDivElement>;
  issuesTableRef?: React.RefObject<HTMLDivElement>;
}

export const ReportButton = ({ dashboardRef, issuesTableRef }: ReportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { sendEmail, isLoading } = useEmailJS();
  const { toast } = useToast();
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'available' | 'unavailable' | 'error' | undefined>(undefined);
  const [alternativeMethod, setAlternativeMethod] = useState<'emailjs' | 'edge'>('emailjs');

  // Función para comprobar conexión con EmailJS
  const checkEmailJSConnection = async (): Promise<boolean> => {
    try {
      setConnectionStatus('checking');
      // Realizar una petición simple a EmailJS para verificar conectividad
      const publicKey = 'RKDqUO9tTPGJrGKLQ';
      emailjs.init(publicKey);
      
      // Verificar disponibilidad del servidor
      const testTemplateParams = {
        to_name: "Test",
        to_email: "test@example.com",
        from_name: "Sistema de Incidencias",
        date: new Date().toLocaleDateString('es-ES'),
        message: "Verificación de conexión"
      };
      
      // No enviar el email, solo obtener token para verificar conectividad
      await emailjs.send('service_yz5opji', 'template_ddq6b3h', testTemplateParams, { accessToken: publicKey });
      setConnectionStatus('available');
      return true;
    } catch (error: any) {
      console.error('Error al verificar conexión con EmailJS:', error);
      
      if (error.status === 401 || error.status === 403) {
        // Problemas de autenticación
        setConnectionStatus('error');
      } else {
        // Otros problemas de conexión
        setConnectionStatus('unavailable');
      }
      return false;
    }
  };

  // Función para obtener todos los emails de responsables con incidencias en estudio o en curso
  const getResponsibleEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('assigned_email')
        .in('status', ['en-estudio', 'en-curso'])
        .not('assigned_email', 'is', null);
      
      if (error) throw error;
      
      // Extraer los emails únicos (eliminar duplicados)
      const uniqueEmails = [...new Set(data
        .map(item => item.assigned_email)
        .filter(email => email && typeof email === 'string' && email.trim() !== '' && email.includes('@'))
      )];
      
      console.log('Emails responsables encontrados:', uniqueEmails);
      
      if (uniqueEmails.length === 0) {
        throw new Error('No se encontraron responsables con correos válidos para incidencias pendientes');
      }
      
      return uniqueEmails;
    } catch (error: any) {
      console.error('Error al obtener emails de responsables:', error);
      throw error;
    }
  };

  // Método alternativo usando la función Edge
  const sendReportViaEdgeFunction = async () => {
    try {
      console.log("Invocando función send-daily-report...");
      
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('send-daily-report', {
        method: 'POST',
        body: { 
          manual: true,
          filteredByUser: true,
          requestId: `manual-${Date.now()}`
        },
      });

      if (functionError) {
        console.error("Error en la función edge:", functionError);
        throw functionError;
      }

      console.log("Respuesta de la función:", functionResponse);
      return functionResponse;
    } catch (error: any) {
      console.error('Error al invocar la función edge:', error);
      throw error;
    }
  };

  // Función para reintentar el envío de reporte
  const retryGenerateReport = async () => {
    setRetryCount(prev => prev + 1);
    await handleGenerateReport();
  };

  // Cambiar método de envío
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
        // Usar la función Edge para enviar el reporte
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
        // Método original con EmailJS
        // Obtener los emails de los responsables
        const responsibleEmails = await getResponsibleEmails();
        console.log('Emails válidos para envío:', responsibleEmails);

        // Formatear la fecha actual en español para el email
        const currentDate = new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        // Enviar a cada responsable
        let successCount = 0;
        let errorCount = 0;
        let lastError = null;

        for (const email of responsibleEmails) {
          try {
            // Re-verificar que el email es válido justo antes de enviar
            if (!email || typeof email !== 'string' || !email.includes('@')) {
              console.error('Email inválido detectado:', email);
              errorCount++;
              continue;
            }

            // Preparar los parámetros para EmailJS - sin limpiar/modificar el email
            const templateParams = {
              to_name: "Responsable de Incidencias",
              to_email: email,  // Usar el email tal cual sin trim ni modificaciones
              from_name: "Sistema de Incidencias",
              date: currentDate,
              message: `Reporte automático de incidencias pendientes generado el ${currentDate}. Por favor, revise el panel de control para obtener información detallada.`,
            };
            
            // Enviar por EmailJS usando el template específico para reportes
            await sendEmail(
              {
                serviceId: 'service_yz5opji',
                templateId: 'template_ddq6b3h', // Template específico para reportes
                publicKey: 'RKDqUO9tTPGJrGKLQ',
              },
              templateParams
            );
            
            successCount++;
            console.log(`Email enviado correctamente a ${email}`);
          } catch (error: any) {
            console.error(`Error al enviar a ${email}:`, error);
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
      console.error("Error al generar/enviar el reporte:", error);
      
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

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateReport}
          disabled={isGenerating || isLoading}
          className={alternativeMethod === 'edge' ? "border-green-600 text-green-700" : ""}
        >
          {isGenerating || isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <FileImage className="mr-2 h-4 w-4" />
              Enviar Reporte {alternativeMethod === 'edge' ? '(Edge)' : '(EmailJS)'}
            </>
          )}
        </Button>
        
        <Button
          variant="ghost" 
          size="sm"
          onClick={toggleSendMethod}
          className="text-xs"
        >
          Usar {alternativeMethod === 'emailjs' ? 'función Edge' : 'EmailJS'}
        </Button>
      </div>
      
      {(lastSendStatus || detailedError || connectionStatus) && (
        <div className="mt-2">
          <EmailStatusAlerts
            lastSendStatus={lastSendStatus}
            detailedError={detailedError}
            retryCount={retryCount}
            connectionStatus={connectionStatus}
            onRetry={retryGenerateReport}
            onCheckConnection={checkEmailJSConnection}
          />
        </div>
      )}
    </div>
  );
};
