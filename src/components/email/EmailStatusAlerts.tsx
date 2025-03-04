
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailStatusAlertsProps {
  lastSendStatus: {success: boolean; message: string} | null;
  detailedError: string | null;
  requestId?: string | null;
  retryCount?: number;
  onRetry?: () => void;
}

export const EmailStatusAlerts = ({ 
  lastSendStatus, 
  detailedError, 
  requestId,
  retryCount,
  onRetry
}: EmailStatusAlertsProps) => {
  // Si no hay estado de envío ni error detallado, mostrar guía de diagnóstico
  if (!lastSendStatus && !detailedError) {
    return (
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
    );
  }
  
  // Detectar si el error está relacionado con autenticación de Gmail
  const isGmailAuthError = detailedError && 
    (detailedError.includes("Username and Password not accepted") || 
     detailedError.includes("Autenticación de Gmail fallida"));
  
  return (
    <div className="space-y-4">
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
            {retryCount !== undefined && retryCount > 0 && !lastSendStatus.success && (
              <span className="ml-2 text-xs"> 
                (Intento {retryCount}/3)
              </span>
            )}
          </AlertTitle>
          <AlertDescription>
            {lastSendStatus.message}
            {requestId && (
              <div className="mt-2 text-xs opacity-80">
                ID de solicitud: {requestId}
              </div>
            )}
            {!lastSendStatus.success && onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 flex items-center gap-1 bg-white hover:bg-white/80"
                onClick={onRetry}
              >
                <RefreshCw className="h-3 w-3" /> Reintentar
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {detailedError && !lastSendStatus?.success && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información de diagnóstico</AlertTitle>
          <AlertDescription className="whitespace-pre-line text-xs">
            {isGmailAuthError ? (
              <div className="space-y-3">
                <p className="font-medium">Error de autenticación de Gmail</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Verifique que la contraseña de aplicación tenga exactamente 16 caracteres (sin espacios)</li>
                  <li>Asegúrese de que la verificación en dos pasos esté activada en su cuenta de Gmail</li>
                  <li>Confirme que está utilizando una contraseña de aplicación generada específicamente para esta aplicación</li>
                  <li>Recuerde que la contraseña de aplicación es diferente de la contraseña normal de Gmail</li>
                  <li><a 
                      href="https://support.google.com/mail/?p=BadCredentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Más información en el centro de ayuda de Google
                    </a>
                  </li>
                </ul>
                <p className="mt-2 pt-2 border-t border-red-200">Detalles técnicos:</p>
                <pre className="bg-red-50/50 p-2 rounded text-[10px] overflow-auto max-h-32">
                  {detailedError}
                </pre>
              </div>
            ) : (
              detailedError
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
