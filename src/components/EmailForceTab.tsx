
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export const EmailForceTab = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiltered, setIsSendingFiltered] = useState(false);
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);

  const handleSendEmail = async (filtered: boolean = false) => {
    try {
      // Limpiar estado anterior
      setLastSendStatus(null);
      
      if (filtered) {
        setIsSendingFiltered(true);
      } else {
        setIsSending(true);
      }
      
      console.log(`Iniciando envío manual de correo ${filtered ? 'filtrado' : 'completo'}`);
      
      // Call the Edge Function to send the email
      const { data, error } = await supabase.functions.invoke('send-daily-report', {
        body: { 
          manual: true,
          filteredByUser: filtered // New parameter to filter by user's pending actions
        }
      });

      if (error) {
        console.error('Error en la respuesta de la función:', error);
        throw new Error(`Error en el servidor: ${error.message || 'Desconocido'}`);
      }

      console.log("Respuesta del envío de correo:", data);
      
      // Almacenar éxito
      setLastSendStatus({
        success: true,
        message: `Se ha enviado el correo programado ${filtered ? 'filtrado por usuario' : 'completo'} con éxito`
      });
      
      toast({
        title: "Correo enviado",
        description: `Se ha enviado el correo programado ${filtered ? 'filtrado por usuario' : 'completo'} con éxito`
      });
    } catch (error) {
      console.error('Error al enviar correo:', error);
      
      // Almacenar error
      setLastSendStatus({
        success: false,
        message: `Error: ${error.message || 'No se pudo enviar el correo programado'}`
      });
      
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo programado",
        variant: "destructive"
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
    <div className="p-4 space-y-4">
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
      
      <Card>
        <CardHeader>
          <CardTitle>Envío Manual de Correo Completo</CardTitle>
          <CardDescription>
            Utilice esta opción para forzar el envío del correo programado con toda la información actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            El correo será enviado a todos los destinatarios configurados y contendrá la información
            actualizada de todas las incidencias registradas en el sistema.
          </p>
          <Button 
            onClick={() => handleSendEmail(false)} 
            disabled={isSending || isSendingFiltered}
            className="w-full sm:w-auto"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSending ? "Enviando..." : "Enviar Correo Completo"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Envío Manual de Correo Filtrado</CardTitle>
          <CardDescription>
            Utilice esta opción para enviar a cada usuario solo las acciones pendientes asignadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Cada destinatario recibirá solo las incidencias pendientes donde esté asignado como responsable,
            mejorando la relevancia de la información recibida.
          </p>
          <Button 
            onClick={() => handleSendEmail(true)} 
            disabled={isSendingFiltered || isSending}
            className="w-full sm:w-auto"
            variant="secondary"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSendingFiltered ? "Enviando..." : "Enviar Correo Filtrado por Usuario"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
