
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAbsoluteUrl } from "@/utils/stringUtils";
import { useEmailJS, EmailJSTemplateParams } from "@/hooks/useEmailJS";

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
    if (!email || !email.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un correo electrónico válido",
        variant: "destructive"
      });
      return;
    }

    try {
      const toEmail = email.trim();
      console.log("Preparando envío de email a:", toEmail);
      
      // Formatear la fecha actual en español
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Construir los parámetros base del template
      const templateParams: EmailJSTemplateParams = {
        to_name: "Usuario",  
        to_email: toEmail,   
        from_name: "Sistema de Incidencias",
        date: currentDate,
        message: message || "No hay mensaje disponible"
      };

      // Opcionalmente añadir la URL de las incidencias
      const issuesPageUrl = getAbsoluteUrl('/issues');
      if (issuesPageUrl) {
        templateParams.issues_url = issuesPageUrl;
      }

      // Opcionalmente añadir la URL de la imagen
      if (imageUrl && typeof imageUrl === 'string' && 
          (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        try {
          // Verificar que sea una URL válida
          new URL(imageUrl);
          templateParams.image_url = imageUrl;
        } catch (e) {
          console.warn("La URL de la imagen no es válida, no se incluirá en el email:", imageUrl);
        }
      }

      console.log("Enviando email con los siguientes parámetros:", JSON.stringify(templateParams));

      // Usar la clave pública completa y correcta para EmailJS
      await sendEmail(
        {
          serviceId: 'service_2yujt9t',
          templateId: 'template_ah9tqde',
          publicKey: 'RKDqUO9tTPGJrGKLQ', // Esta clave está incompleta, se necesita la clave completa
        },
        templateParams
      );

      toast({
        title: "Correo enviado",
        description: `Se ha enviado la notificación a ${toEmail} exitosamente`
      });
    } catch (error) {
      console.error('Error sending email:', error);
      
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
