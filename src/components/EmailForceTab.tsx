import { EmailStatusAlerts } from "@/components/email/EmailStatusAlerts";
import { EmailActionCard } from "@/components/email/EmailActionCard";
import { useEmailSender } from "@/hooks/useEmailSender";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, UserCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const EmailForceTab = () => {
  const {
    isSending,
    isSendingFiltered,
    lastSendStatus,
    detailedError,
    lastRequestId,
    retryCount,
    connectionStatus,
    handleSendEmail,
    handleRetry,
    checkEdgeFunctionStatus
  } = useEmailSender();
  
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  const handleCheckConnection = async (): Promise<boolean> => {
    setIsCheckingConnection(true);
    try {
      const result = await checkEdgeFunctionStatus();
      return result;
    } finally {
      setIsCheckingConnection(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <EmailStatusAlerts 
        lastSendStatus={lastSendStatus}
        detailedError={detailedError}
        requestId={lastRequestId}
        retryCount={retryCount}
        connectionStatus={connectionStatus}
        onRetry={handleRetry}
        onCheckConnection={handleCheckConnection}
      />
      
      <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">Envío Manual de Correos</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Utilice estas opciones para enviar correos electrónicos de forma manual. Los correos incluyen un diseño mejorado con una interfaz más visual.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <EmailActionCard
              title="Envío de Correo Completo"
              description="Reporte general para todos los destinatarios"
              content="El correo será enviado a francisco.garcia@lingotes.com y
                       contendrá la información actualizada de todas las incidencias
                       registradas en el sistema."
              buttonText="Enviar Correo Completo"
              isLoading={isSending}
              onClick={() => handleSendEmail(false)}
              variant="default"
            />

            <EmailActionCard
              title="Envío Personalizado"
              description="Correo filtrado por responsable asignado"
              content="Cada destinatario recibirá solo las incidencias pendientes donde esté asignado como responsable,
                      mejorando la relevancia de la información recibida con un diseño visual mejorado."
              buttonText="Enviar Correo Filtrado"
              isLoading={isSendingFiltered}
              onClick={() => handleSendEmail(true)}
              variant="secondary"
              highlight={true}
            />
          </div>
          
          {connectionStatus === 'unavailable' || connectionStatus === 'error' ? (
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleCheckConnection}
                disabled={isCheckingConnection}
              >
                {isCheckingConnection ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isCheckingConnection ? "Verificando conexión..." : "Verificar disponibilidad del servidor"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      
      <Separator className="my-2" />
      
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-muted-foreground">
        <div className="flex items-center mb-1">
          <UserCheck className="h-4 w-4 text-blue-500 mr-1" />
          <p className="font-medium text-gray-700">Información</p>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>El correo completo se envía a francisco.garcia@lingotes.com.</li>
          <li>El correo filtrado se envía solo a usuarios con incidencias pendientes asignadas.</li>
          <li>Los correos tienen un diseño mejorado con imagenes optimizadas y formato más visual.</li>
          <li>Los correos incluyen enlaces directos a las incidencias para fácil acceso.</li>
          <li>Si encuentra problemas, verifique que las variables GMAIL_USER y GMAIL_APP_PASSWORD estén correctamente configuradas en Supabase.</li>
        </ul>
      </div>
    </div>
  );
};
