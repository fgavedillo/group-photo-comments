
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const EmailForceTab = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiltered, setIsSendingFiltered] = useState(false);
  const [lastSendStatus, setLastSendStatus] = useState<{success: boolean; message: string} | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  const handleSendEmail = async (filtered: boolean = false) => {
    try {
      // Limpiar estado anterior
      setLastSendStatus(null);
      setDetailedError(null);
      
      if (filtered) {
        setIsSendingFiltered(true);
      } else {
        setIsSending(true);
      }
      
      console.log(`Iniciando envío manual de correo ${filtered ? 'filtrado' : 'completo'}`);
      
      // Call the Edge Function to send the email with a longer timeout
      const { data, error } = await supabase.functions.invoke('send-daily-report', {
        body: { 
          manual: true,
          filteredByUser: filtered // Parameter to filter by user's pending actions
        },
        // Aumentar el timeout para dar más tiempo a la función
        options: {
          timeout: 60000 // 60 segundos (ajustar según sea necesario)
        }
      });

      if (error) {
        console.error('Error en la respuesta de la función:', error);
        
        // Extraer información detallada del error para mostrar al usuario
        let errorMessage = `Error en el servidor: ${error.message || 'Desconocido'}`;
        let detailedInfo = '';
        
        if (error.name === 'FunctionsFetchError') {
          errorMessage = 'Error de conexión con el servidor. No se pudo establecer comunicación con la función.';
          detailedInfo = `
            Detalles técnicos:
            - Tipo de error: ${error.name}
            - Mensaje: ${error.message}
            
            Posibles causas:
            - Problemas de red o conexión
            - La función puede estar desactivada o en mantenimiento
            - Tiempo de respuesta excedido (timeout)
            
            Recomendaciones:
            - Verificar su conexión a internet
            - Intentar nuevamente en unos minutos
            - Contactar al administrador si el problema persiste
          `;
          setDetailedError(detailedInfo);
        }
        
        throw new Error(errorMessage);
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
      
      {detailedError && !lastSendStatus?.success && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información de diagnóstico</AlertTitle>
          <AlertDescription className="whitespace-pre-line text-xs">
            {detailedError}
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
            {isSendingFiltered ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Correo Filtrado por Usuario
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
