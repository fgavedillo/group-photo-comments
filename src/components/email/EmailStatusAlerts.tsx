
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, RefreshCw, AlertTriangle, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailStatusAlertsProps {
  lastSendStatus: {success: boolean; message: string} | null;
  detailedError: string | null;
  requestId?: string | null;
  retryCount?: number;
  connectionStatus?: 'checking' | 'available' | 'unavailable' | 'error';
  onRetry?: () => void;
  onCheckConnection?: () => Promise<boolean>;
}

export const EmailStatusAlerts = ({ 
  lastSendStatus, 
  detailedError, 
  requestId,
  retryCount,
  connectionStatus,
  onRetry,
  onCheckConnection
}: EmailStatusAlertsProps) => {
  // Mostrar estado de conexión si está disponible
  if (connectionStatus && !lastSendStatus) {
    let alertVariant: "default" | "destructive" | "warning" = "default";
    let icon = <Info className="h-4 w-4" />;
    let title = "Estado de la conexión";
    let description = "";
    
    switch (connectionStatus) {
      case 'checking':
        alertVariant = "default";
        icon = <Server className="h-4 w-4 animate-pulse" />;
        title = "Verificando conexión";
        description = "Comprobando la disponibilidad del servidor de correo...";
        break;
      case 'available':
        alertVariant = "default";
        icon = <CheckCircle className="h-4 w-4 text-green-500" />;
        title = "Servidor disponible";
        description = "La conexión con el servidor de correo está activa y funcionando correctamente.";
        break;
      case 'unavailable':
        alertVariant = "warning";
        icon = <AlertTriangle className="h-4 w-4" />;
        title = "Servidor no responde";
        description = "El servidor de correo no está respondiendo. Esto puede ser temporal o indicar un problema de configuración.";
        break;
      case 'error':
        alertVariant = "destructive";
        icon = <AlertCircle className="h-4 w-4" />;
        title = "Error de conexión";
        description = "No se pudo establecer conexión con el servidor de correo. Verifique su conexión a internet y la configuración del servidor.";
        break;
    }
    
    return (
      <Alert variant={alertVariant} className={connectionStatus === 'available' ? "bg-green-50 border-green-200" : ""}>
        {icon}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {description}
          {(connectionStatus === 'unavailable' || connectionStatus === 'error') && onCheckConnection && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-1 flex items-center gap-1 bg-white hover:bg-white/80"
                onClick={() => onCheckConnection()}
              >
                <RefreshCw className="h-3 w-3" /> Verificar nuevamente
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
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
            <li>La función Edge 'send-email' está publicada y activa</li>
            <li>Las variables GMAIL_USER y GMAIL_APP_PASSWORD están correctamente configuradas en Supabase</li>
            <li>La contraseña de aplicación no tiene espacios (debe ser exactamente 16 caracteres)</li>
            <li>La cuenta de Gmail tiene habilitada la verificación en dos pasos</li>
            <li>Está usando una contraseña de aplicación válida para Gmail (16 caracteres sin espacios)</li>
            <li>El dominio desde donde se hace la petición está permitido en la configuración CORS</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Detectar si el error está relacionado con autenticación de Gmail
  const isGmailAuthError = detailedError && 
    (detailedError.includes("Username and Password not accepted") || 
     detailedError.includes("Autenticación de Gmail fallida") ||
     detailedError.includes("contraseña de aplicación") ||
     detailedError.includes("535-5.7.8"));
  
  // Detectar errores de CORS
  const isCorsError = detailedError &&
    (detailedError.includes("CORS") || detailedError.includes("Access-Control-Allow-Origin"));
  
  // Detectar errores de conexión
  const isConnectionError = detailedError &&
    (detailedError.includes("Failed to fetch") || 
     detailedError.includes("Network Error") ||
     detailedError.includes("tiempo de espera") ||
     detailedError.includes("Tiempo de espera excedido"));
  
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
            {!lastSendStatus.success && onRetry && retryCount !== undefined && retryCount < 3 && (
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
                  <li>
                    Para generar una nueva contraseña de aplicación:
                    <ol className="list-decimal pl-5 mt-1 text-[10px]">
                      <li>Vaya a su cuenta de Google</li>
                      <li>Seleccione "Seguridad"</li>
                      <li>En "Iniciar sesión en Google", seleccione "Verificación en 2 pasos"</li>
                      <li>Al final de la página, seleccione "Contraseñas de aplicación"</li>
                      <li>Copie la contraseña generada (sin espacios) y actualice el secreto en Supabase</li>
                    </ol>
                  </li>
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
            ) : isCorsError ? (
              <div className="space-y-3">
                <p className="font-medium">Error de políticas CORS</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>La función Edge no está configurada correctamente para aceptar solicitudes de este origen</li>
                  <li>Verifique que la función Edge tenga los encabezados CORS correctamente configurados</li>
                  <li>Asegúrese de que la función Edge esté publicada y activa</li>
                </ul>
                <p className="mt-2 pt-2 border-t border-red-200">Detalles técnicos:</p>
                <pre className="bg-red-50/50 p-2 rounded text-[10px] overflow-auto max-h-32">
                  {detailedError}
                </pre>
              </div>
            ) : isConnectionError ? (
              <div className="space-y-3">
                <p className="font-medium">Error de conexión</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>No se pudo establecer conexión con la función Edge</li>
                  <li>Verifique su conexión a internet</li>
                  <li>La función Edge podría estar inactiva o no responder</li>
                  <li>La URL de la función Edge podría ser incorrecta</li>
                  <li>Si el problema persiste, verifique que la función esté publicada y activa en Supabase</li>
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
