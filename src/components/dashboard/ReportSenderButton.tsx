
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useReportSender } from "@/hooks/useReportSender";
import { FileImage, RefreshCw, Filter, AlertCircle, CheckCircle, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReportMethodSelector } from "./ReportMethodSelector";

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
  
  const handleSendReport = async () => {
    try {
      console.log(`Enviando reporte ${filtered ? 'personalizado' : 'completo'} con ${useResend ? 'Resend' : 'EmailJS'}...`);
      await sendReport(filtered);
    } catch (err) {
      // El error ya está manejado en el hook
      console.error("Error manejado en el botón:", err);
    }
  };
  
  const toggleFilter = () => {
    setFiltered(!filtered);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendReport}
          disabled={isLoading}
          className={filtered ? "border-green-600 text-green-700" : ""}
          title={filtered ? "Envía a cada responsable solo sus incidencias asignadas" : "Envía todas las incidencias a todos los responsables configurados"}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <FileImage className="mr-2 h-4 w-4" />
              {filtered 
                ? "Enviar Reporte a Responsables Individuales" 
                : "Enviar Reporte a Todos los Responsables"}
            </>
          )}
        </Button>
        
        <Button
          variant="ghost" 
          size="sm"
          onClick={toggleFilter}
          className="text-xs"
          title={filtered ? "Cambiar a modo de envío a todos los responsables" : "Cambiar a modo de envío personalizado por responsable"}
        >
          <Filter className={`h-4 w-4 mr-2 ${filtered ? 'text-green-600' : ''}`} />
          {filtered ? "Modo Global" : "Modo Individual"}
        </Button>
        
        <ReportMethodSelector
          useResend={useResend}
          toggleSendMethod={toggleSendMethod}
        />
        
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <span>Usando: {useResend ? 'Resend' : 'EmailJS'}</span>
        </div>
      </div>
      
      {error ? (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de envío</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : lastResponse?.success && lastResponse.data?.stats?.successCount > 0 ? (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Envío exitoso</AlertTitle>
          <AlertDescription>
            Se envió el reporte con {useResend ? 'Resend' : 'EmailJS'} a {lastResponse.data?.stats?.successCount || 0} destinatario(s) exitosamente.
            {lastResponse.data?.stats && (
              <div className="text-xs mt-1 text-gray-500">
                {lastResponse.data.stats.successCount} envíos exitosos, {lastResponse.data.stats.failureCount} fallidos.
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};
