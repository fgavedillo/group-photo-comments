
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
      const issuesPageUrl = getAbsoluteUrl('/issues');
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      await sendEmail(
        {
          serviceId: 'service_lwkfkwj', // Reemplaza con tu Service ID
          templateId: 'template_ah9tqde', // Template ID proporcionado
          publicKey: 'i3HY0xzZLdBPwGTDH', // Reemplaza con tu Public Key
        },
        {
          to_email: email,
          message,
          date: currentDate,
          issues_url: issuesPageUrl,
          image_url: imageUrl || ''
        }
      );

      toast({
        title: "Correo enviado",
        description: "Se ha enviado la notificación exitosamente"
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
