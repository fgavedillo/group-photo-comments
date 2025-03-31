
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useReportSender } from "@/hooks/useReportSender";
import { FileText, RefreshCw, Filter, AlertCircle, CheckCircle, Mail, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReportMethodSelector } from "./ReportMethodSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getResponsibleEmails } from "@/utils/emailUtils";

export const ReportSenderButton = () => {
  const { 
    sendReport, 
    isLoading, 
    error, 
    lastResponse, 
    useResend, 
    toggleSendMethod 
  } = useReportSender();
  
  const [filtered, setFiltered] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  
  // Obtener la lista de correos de destinatarios al cargar el componente
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoadingEmails(true);
        const emails = await getResponsibleEmails();
        setRecipientEmails(emails);
      } catch (err) {
        console.error("Error al obtener emails de responsables:", err);
      } finally {
        setLoadingEmails(false);
      }
    };
    
    fetchEmails();
  }, []);
  
  const handleSendReport = async () => {
    try {
      console.log(`Enviando reporte ${filtered ? 'personalizado' : 'completo'} con ${useResend ? 'Resend' : 'EmailJS'}...`);
      await sendReport(filtered);
    } catch (err) {
      // Error ya manejado en el hook
      console.error("Error manejado en el botón:", err);
    }
  };
  
  const toggleFilter = () => {
    setFiltered(!filtered);
  };

  // Datos del remitente según la configuración
  const senderEmail = useResend ? "info@prlconecta.es" : "sistema@prlconecta.es";
  const senderName = "Sistema de Gestión PRL Conecta";
  
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendReport}
          disabled={isLoading}
          className={filtered ? "border-green-600 text-green-700" : ""}
          title={filtered ? "Enviar a cada persona solo sus incidencias asignadas" : "Enviar todas las incidencias a todos los contactos configurados"}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {filtered 
                ? "Enviar Reporte Individual" 
                : "Enviar Reporte Completo"}
            </>
          )}
        </Button>
        
        <Button
          variant="ghost" 
          size="sm"
          onClick={toggleFilter}
          className="text-xs"
          title={filtered ? "Cambiar a modo de envío global" : "Cambiar a modo de envío personalizado"}
        >
          <Filter className={`h-4 w-4 mr-2 ${filtered ? 'text-green-600' : ''}`} />
          {filtered ? "Modo Global" : "Modo Individual"}
        </Button>
        
        <ReportMethodSelector
          useResend={useResend}
          toggleSendMethod={toggleSendMethod}
        />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <div className="text-xs space-y-2">
                <p><strong>Remitente:</strong> {senderName} &lt;{senderEmail}&gt;</p>
                <p><strong>Servicio:</strong> {useResend ? 'Resend' : 'EmailJS'}</p>
                <p>
                  <strong>Destinatarios ({recipientEmails.length}):</strong> {' '}
                  {loadingEmails ? 'Cargando...' : 
                    recipientEmails.length > 0 
                      ? recipientEmails.join(', ')
                      : 'No se encontraron destinatarios'}
                </p>
                <p>
                  <strong>Modo:</strong> {filtered 
                    ? 'Individual (cada responsable recibe solo sus incidencias asignadas)' 
                    : 'Global (todos reciben todas las incidencias)'}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <span>Usando: {useResend ? 'Resend' : 'EmailJS'}</span>
        </div>
      </div>
      
      {error ? (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al enviar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : lastResponse?.success ? (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Envío exitoso</AlertTitle>
          <AlertDescription>
            El reporte se ha enviado correctamente con {useResend ? 'Resend' : 'EmailJS'}.
            {lastResponse.data?.stats && (
              <div className="text-xs mt-1 text-gray-500">
                {lastResponse.data.stats.successCount || 0} envíos exitosos, {lastResponse.data.stats.failureCount || 0} fallidos.
              </div>
            )}
            {lastResponse.data?.recipients && (
              <div className="text-xs mt-1 text-gray-500">
                <strong>Destinatarios:</strong> {Array.isArray(lastResponse.data.recipients) 
                  ? lastResponse.data.recipients.join(', ') 
                  : 'No especificados'}
              </div>
            )}
            <div className="text-xs mt-1 text-gray-500">
              <strong>Remitente:</strong> {senderName} &lt;{senderEmail}&gt;
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};
