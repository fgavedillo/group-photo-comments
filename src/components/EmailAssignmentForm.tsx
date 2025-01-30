import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/supabase";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  message: string;
}

export const EmailAssignmentForm = ({ assignedEmail, onEmailChange, message }: EmailAssignmentFormProps) => {
  const { toast } = useToast();

  const handleSendEmail = async () => {
    if (!assignedEmail) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un correo electrónico",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendEmail(
        assignedEmail,
        "Nueva incidencia asignada",
        `Se le ha asignado una nueva incidencia: ${message}`
      );

      toast({
        title: "Correo enviado",
        description: "Se ha enviado la notificación exitosamente"
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el correo",
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
          value={assignedEmail}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <Button 
          variant="outline" 
          onClick={handleSendEmail}
          className="shrink-0"
        >
          <Mail className="mr-2 h-4 w-4" />
          Enviar
        </Button>
      </div>
    </div>
  );
};