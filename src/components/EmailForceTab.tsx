
import { EmailStatusAlerts } from "@/components/email/EmailStatusAlerts";
import { EmailActionCard } from "@/components/email/EmailActionCard";
import { useEmailSender } from "@/hooks/useEmailSender";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const EmailForceTab = () => {
  const {
    isSending,
    isSendingFiltered,
    lastSendStatus,
    detailedError,
    lastRequestId,
    retryCount,
    handleSendEmail,
    handleRetry
  } = useEmailSender();

  return (
    <div className="p-4 space-y-6">
      <EmailStatusAlerts 
        lastSendStatus={lastSendStatus}
        detailedError={detailedError}
        requestId={lastRequestId}
        retryCount={retryCount}
        onRetry={handleRetry}
      />
      
      <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Envío Manual de Correos</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Utilice estas opciones para enviar correos electrónicos de forma manual. Los correos incluyen un diseño mejorado con una interfaz más visual.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <EmailActionCard
              title="Envío de Correo Completo"
              description="Reporte general para todos los destinatarios"
              content="El correo será enviado a todos los destinatarios configurados y contendrá la información
                      actualizada de todas las incidencias registradas en el sistema."
              buttonText="Enviar Correo Completo"
              isLoading={isSending}
              onClick={() => handleSendEmail(false)}
              variant="default"
            />

            <EmailActionCard
              title="Envío Personalizado"
              description="Correo filtrado por responsable asignado"
              content="Cada destinatario recibirá solo las incidencias pendientes donde esté asignado como responsable,
                      mejorando la relevancia de la información recibida."
              buttonText="Enviar Correo Filtrado"
              isLoading={isSendingFiltered}
              onClick={() => handleSendEmail(true)}
              variant="secondary"
              highlight={true}
            />
          </div>
        </CardContent>
      </Card>
      
      <Separator className="my-2" />
      
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-gray-700 mb-1">Información</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>El correo completo se envía a todos los destinatarios configurados.</li>
          <li>El correo filtrado se envía solo a usuarios con incidencias pendientes asignadas.</li>
          <li>Los correos tienen un diseño mejorado con un formato más visual.</li>
          <li>Los correos incluyen enlaces directos a las incidencias para fácil acceso.</li>
        </ul>
      </div>
    </div>
  );
};
