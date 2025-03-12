
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAbsoluteUrl } from "@/utils/stringUtils";
import { useEmailJS } from "@/hooks/useEmailJS";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  message: string;
  imageUrl?: string;
}

export const EmailAssignmentForm = ({ assignedEmail, onEmailChange, message, imageUrl }: EmailAssignmentFormProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(assignedEmail);
  const { sendEmail, isLoading, error: emailError } = useEmailJS();

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

    try {
      // Construir la URL absoluta para el enlace de la página de incidencias
      const issuesPageUrl = getAbsoluteUrl('/issues');
      
      // Formatear la fecha actual en español
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Preparar los parámetros básicos sin la imagen
      const templateParams: Record<string, string> = {
        to_name: "Usuario",
        to_email: email,
        from_name: "Sistema de Incidencias",
        date: currentDate,
        message: message || "",
        issues_url: issuesPageUrl,
      };

      // Solo agregar la URL de la imagen si existe y parece válida
      if (imageUrl && imageUrl.startsWith('http')) {
        templateParams.image_url = imageUrl;
      }

      console.log("Enviando email con parámetros:", templateParams);

      // Enviar el email utilizando los parámetros y la configuración de EmailJS
      await sendEmail(
        {
          serviceId: 'service_2yujt9t',
          templateId: 'template_ah9tqde',
          publicKey: 'RKDqUO9tTPGJrGKLQ',
        },
        templateParams
      );

      // Mostrar un mensaje de éxito al usuario
      toast({
        title: "Correo enviado",
        description: "Se ha enviado la notificación exitosamente"
      });
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Mostrar un mensaje de error al usuario
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar el correo",
        variant: "destructive"
      });
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
          disabled={isLoading}
        >
          {isLoading ? (
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
      
      {emailError && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {emailError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
