
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface EmailStatusAlertsProps {
  lastSendStatus: {success: boolean; message: string} | null;
  detailedError: string | null;
  requestId?: string | null;
  retryCount?: number;
}

export const EmailStatusAlerts = ({ 
  lastSendStatus, 
  detailedError, 
  requestId
}: EmailStatusAlertsProps) => {
  if (!lastSendStatus && !detailedError) return null;
  
  return (
    <div className="space-y-4">
      {!lastSendStatus && !detailedError && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Información de diagnóstico</AlertTitle>
          <AlertDescription>
            Para enviar correos, asegúrese de que:
            <ul className="list-disc pl-5 mt-2 text-sm">
              <li>Ha iniciado sesión en la aplicación</li>
              <li>La función Edge 'send-email' está publicada</li>
              <li>Las variables GMAIL_USER y GMAIL_APP_PASSWORD están correctamente configuradas en Supabase</li>
              <li>La cuenta de Gmail tiene habilitada la verificación en dos pasos</li>
              <li>Está usando una contraseña de aplicación válida para Gmail (16 caracteres sin espacios)</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {lastSendStatus && (
        <Alert variant={lastSendStatus.success ? "default" : "destructive"} 
               className={lastSendStatus.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          {lastSendStatus.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {lastSendStatus.success ? "Envío exitoso" : "Error de envío"}
          </AlertTitle>
          <AlertDescription>
            {lastSendStatus.message}
            {requestId && (
              <div className="mt-2 text-xs opacity-80">
                ID de solicitud: {requestId}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {detailedError && !lastSendStatus?.success && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información de diagnóstico</AlertTitle>
          <AlertDescription className="whitespace-pre-line text-xs">
            {detailedError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
