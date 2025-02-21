import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  message: string;
  imageUrl?: string;
}

export const EmailAssignmentForm = ({ assignedEmail, onEmailChange, message, imageUrl }: EmailAssignmentFormProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(assignedEmail);

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
      const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nueva incidencia asignada</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          ${imageUrl ? `<img src="${imageUrl}" alt="Imagen de la incidencia" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;">` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 0.9em;">
            Este es un mensaje automático del sistema de gestión de incidencias.
          </p>
        </div>
      `;

      await sendEmail(
        email,
        "Nueva incidencia asignada",
        emailContent
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
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
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