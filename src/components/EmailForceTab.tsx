
import { EmailStatusAlerts } from "@/components/email/EmailStatusAlerts";
import { EmailActionCard } from "@/components/email/EmailActionCard";
import { useEmailSender } from "@/hooks/useEmailSender";

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
    <div className="p-4 space-y-4">
      <EmailStatusAlerts 
        lastSendStatus={lastSendStatus}
        detailedError={detailedError}
        requestId={lastRequestId}
        retryCount={retryCount}
        onRetry={handleRetry}
      />
      
      <EmailActionCard
        title="Envío Manual de Correo Completo"
        description="Utilice esta opción para forzar el envío del correo programado con toda la información actual."
        content="El correo será enviado a todos los destinatarios configurados y contendrá la información
                actualizada de todas las incidencias registradas en el sistema."
        buttonText="Enviar Correo Completo"
        isLoading={isSending}
        onClick={() => handleSendEmail(false)}
        variant="default"
      />

      <EmailActionCard
        title="Envío Manual de Correo Filtrado"
        description="Utilice esta opción para enviar a cada usuario solo las acciones pendientes asignadas."
        content="Cada destinatario recibirá solo las incidencias pendientes donde esté asignado como responsable,
                mejorando la relevancia de la información recibida."
        buttonText="Enviar Correo Filtrado por Usuario"
        isLoading={isSendingFiltered}
        onClick={() => handleSendEmail(true)}
        variant="secondary"
      />
    </div>
  );
};
