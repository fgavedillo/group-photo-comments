
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, UserCheck, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const EmailForceTab = () => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiltered, setIsSendingFiltered] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'available' | 'unavailable' | 'unknown'>('unknown');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Verificar la conexión al montar el componente
  useEffect(() => {
    checkConnection();
    
    // Verificar cada 5 minutos
    const interval = setInterval(() => {
      checkConnection();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const checkConnection = async () => {
    setIsChecking(true);
    setConnectionStatus('checking');
    
    try {
      // Hacer una solicitud OPTIONS para verificar que el servidor responde
      const response = await fetch("https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email", {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setConnectionStatus('available');
        console.log("Servidor de correo disponible:", response.status);
      } else {
        setConnectionStatus('unavailable');
        console.error("Error al verificar el servidor de correo:", response.status);
      }
    } catch (error) {
      console.error("Error al verificar la conexión:", error);
      setConnectionStatus('unavailable');
    } finally {
      setIsChecking(false);
    }
  };

  const sendEmail = async (filtered: boolean) => {
    try {
      if (filtered) {
        setIsSendingFiltered(true);
      } else {
        setIsSending(true);
      }
      
      setLastResponse(null);
      setErrorDetails(null);
      
      const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-daily-report";
      
      // ID único para seguimiento
      const requestId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabase.supabaseKey
        },
        body: JSON.stringify({
          manual: true,
          filteredByUser: filtered,
          requestId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setLastResponse(data);
      
      toast({
        title: "Envío exitoso",
        description: filtered 
          ? "Se han enviado los correos personalizados correctamente" 
          : "Se ha enviado el correo completo correctamente",
      });
      
    } catch (error) {
      console.error("Error al enviar correo:", error);
      
      setLastResponse({
        success: false,
        error: error.message
      });
      
      // Capturar detalles del error para mostrarlos
      setErrorDetails(error.stack || error.message);
      
      toast({
        title: "Error al enviar correo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (filtered) {
        setIsSendingFiltered(false);
      } else {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Estado de la conexión */}
      {connectionStatus !== 'unknown' && (
        <Alert variant={connectionStatus === 'available' ? "default" : "destructive"} 
               className={connectionStatus === 'available' ? "bg-green-50" : "bg-red-50"}>
          {connectionStatus === 'available' ? (
            <CheckCircle className="h-4 w-4" />
          ) : connectionStatus === 'checking' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {connectionStatus === 'available' 
              ? "Servidor disponible" 
              : connectionStatus === 'checking'
                ? "Verificando conexión"
                : "Servidor no disponible"}
          </AlertTitle>
          <AlertDescription>
            {connectionStatus === 'available' 
              ? "El servidor de correo está funcionando correctamente." 
              : connectionStatus === 'checking'
                ? "Comprobando la disponibilidad del servidor..."
                : "No se puede conectar con el servidor de correo. Verifica que la función esté desplegada y las variables de entorno configuradas."}
            
            {connectionStatus !== 'checking' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkConnection} 
                disabled={isChecking}
                className="mt-2"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verificar nuevamente
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Mostrar resultado del último envío si existe */}
      {lastResponse && (
        <Alert variant={lastResponse.success ? "default" : "destructive"} 
               className={lastResponse.success ? "bg-green-50" : "bg-red-50"}>
          {lastResponse.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {lastResponse.success ? "Envío exitoso" : "Error en el envío"}
          </AlertTitle>
          <AlertDescription>
            {lastResponse.success 
              ? `Se completó la operación en ${lastResponse.elapsedTime || "unos segundos"}.` 
              : (lastResponse.error || "Ocurrió un error al enviar los correos.")}
            
            {errorDetails && !lastResponse.success && (
              <details className="mt-2">
                <summary className="text-sm font-medium cursor-pointer">Ver detalles técnicos</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {errorDetails}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Tarjetas de opciones de envío */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">Envío Manual de Correos</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Utilice estas opciones para enviar correos electrónicos con el informe de incidencias de forma manual.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Opción 1: Correo Completo */}
            <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-2">Correo Completo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Envía un correo con todas las incidencias a francisco.garcia@lingotes.com
              </p>
              <Button 
                className="w-full" 
                onClick={() => sendEmail(false)}
                disabled={isSending || isSendingFiltered}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Correo Completo
                  </>
                )}
              </Button>
            </div>
            
            {/* Opción 2: Correo Filtrado */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-2">Correo Personalizado</h3>
              <p className="text-sm text-gray-600 mb-4">
                Envía correos individuales a cada responsable con solo sus incidencias asignadas
              </p>
              <Button 
                className="w-full"
                variant="secondary"
                onClick={() => sendEmail(true)}
                disabled={isSending || isSendingFiltered}
              >
                {isSendingFiltered ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Enviar Correos Filtrados
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Separator className="my-2" />
      
      {/* Información adicional */}
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-muted-foreground">
        <h4 className="font-medium text-gray-700 mb-2">Información sobre el envío de correos</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>El correo completo se envía a francisco.garcia@lingotes.com.</li>
          <li>Los correos filtrados se envían solo a usuarios con incidencias pendientes asignadas.</li>
          <li>Para que funcione correctamente, las siguientes variables deben estar configuradas en Supabase:</li>
          <ul className="list-circle pl-5 mt-1 mb-1">
            <li><code className="bg-gray-100 px-1 py-0.5 rounded">GMAIL_USER</code>: Dirección completa de Gmail</li>
            <li><code className="bg-gray-100 px-1 py-0.5 rounded">GMAIL_APP_PASSWORD</code>: Contraseña de aplicación de Gmail (16 caracteres)</li>
          </ul>
          <li>La cuenta de Gmail debe tener habilitada la verificación en dos pasos.</li>
          <li>Las contraseñas de aplicación se generan en la <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">configuración de seguridad de Google</a>.</li>
        </ul>
      </div>
    </div>
  );
};
