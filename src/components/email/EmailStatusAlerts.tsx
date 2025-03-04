
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface EmailStatusAlertsProps {
  lastSendStatus: {success: boolean; message: string} | null;
  detailedError: string | null;
}

export const EmailStatusAlerts = ({ lastSendStatus, detailedError }: EmailStatusAlertsProps) => {
  if (!lastSendStatus && !detailedError) return null;
  
  return (
    <div className="space-y-4">
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
