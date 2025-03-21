import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEmailJS, EmailJSTemplateParams } from "@/hooks/useEmailJS";
import { Issue } from "@/types/issue";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  message: string;
  imageUrl?: string;
  issue?: Issue;  // Añadimos issue como prop opcional
}

export const EmailAssignmentForm = ({ 
  assignedEmail, 
  onEmailChange, 
  message, 
  imageUrl,
  issue 
}: EmailAssignmentFormProps) => {
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

      // Enviar todos los campos disponibles de la incidencia
      const templateParams: EmailJSTemplateParams = {
        to_name: "Usuario",  
        to_email: toEmail,   
        from_name: "Sistema de Incidencias",
        date: currentDate,
        message: message || "",
        area: issue?.area || "",
        responsable: issue?.responsable || "",
        status: issue?.status || "",
        security_improvement: issue?.securityImprovement || "",
        action_plan: issue?.actionPlan || "",
        id: issue?.id ? String(issue.id) : ""
      };

      console.log("Enviando email con los siguientes parámetros:", JSON.stringify(templateParams));

      // Usar el template específico para notificaciones de incidencias individuales
      await sendEmail(
        {
          serviceId: 'service_yz5opji',
          templateId: 'template_ah9tqde', // Template específico para notificaciones de incidencias
          publicKey: 'RKDqUO9tTPGJrGKLQ',
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
