
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const EmailForceTab = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    try {
      setIsSending(true);
      console.log("Iniciando envío manual de correo programado");
      
      // Llamar a la función Edge de Supabase para enviar el correo
      const { data, error } = await supabase.functions.invoke('send-daily-report', {
        body: { manual: true }
      });

      if (error) {
        throw error;
      }

      console.log("Respuesta del envío de correo:", data);
      
      toast({
        title: "Correo enviado",
        description: "Se ha enviado el correo programado manualmente con éxito"
      });
    } catch (error) {
      console.error('Error al enviar correo:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el correo programado",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Envío Manual de Correo</CardTitle>
          <CardDescription>
            Utilice esta opción para forzar el envío del correo programado con la información actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            El correo será enviado a todos los destinatarios configurados y contendrá la información
            actualizada de todas las incidencias registradas en el sistema.
          </p>
          <Button 
            onClick={handleSendEmail} 
            disabled={isSending}
            className="w-full sm:w-auto"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSending ? "Enviando..." : "Enviar Correo Ahora"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
