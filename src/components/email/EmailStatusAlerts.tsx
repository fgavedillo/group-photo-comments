
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface EmailStatusAlertsProps {
  lastSendStatus: {success: boolean; message: string} | null;
  detailedError: string | null;
  requestId?: string | null;
  retryCount?: number;
}

export const EmailStatusAlerts = ({ 
  lastSendStatus, 
  detailedError, 
  requestId,
  retryCount = 0
}: EmailStatusAlertsProps) => {
  if (!lastSendStatus && !detailedError && retryCount === 0) return null;
  
  return (
    <div className="space-y-4">
      {retryCount > 0 && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle>Reintentando conexión</AlertTitle>
          <AlertDescription>
            Se está reintentando la conexión con el servidor. Intento {retryCount} de 3.
          </AlertDescription>
        </Alert>
      )}
      
      {lastSendStatus && (
        <Alert variant={lastSendStatus.success ? "default" : "destructive"}>
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
