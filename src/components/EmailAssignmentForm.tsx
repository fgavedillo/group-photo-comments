
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAbsoluteUrl } from "@/utils/stringUtils";
import { supabase } from "@/integrations/supabase/client";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  message: string;
  imageUrl?: string;
}

export const EmailAssignmentForm = ({ assignedEmail, onEmailChange, message, imageUrl }: EmailAssignmentFormProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(assignedEmail);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(assignedEmail);
  }, [assignedEmail]);

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    onEmailChange(newEmail);
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un correo electrónico",
        variant: "destructive"
      });
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      // Get absolute URL for links
      const issuesPageUrl = getAbsoluteUrl('/issues');
      
      // Improved format for the email
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      // Usar la función Edge de Acumbamail mediante supabase.functions.invoke
      const { data, error: functionError } = await supabase.functions.invoke("send-acumbamail", {
        body: {
          to: email,
          subject: "Nueva incidencia asignada - Acción requerida",
          description: message,
          date: currentDate,
          issuesPageUrl,
          imageUrl: imageUrl || null
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Error al invocar la función');
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al enviar el correo');
      }

      toast({
        title: "Correo enviado",
        description: "Se ha enviado la notificación exitosamente con Acumbamail"
      });
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error.message || "No se pudo enviar el correo");
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium">Correo de Notificación</h4>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
        />
        <Button 
          variant="outline" 
          onClick={handleSendEmail}
          className="shrink-0"
          disabled={isSending}
        >
          {isSending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Enviar
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
