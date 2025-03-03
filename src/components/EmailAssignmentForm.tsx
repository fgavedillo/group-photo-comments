
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { decodeQuotedPrintable, getAbsoluteUrl } from "@/utils/stringUtils";

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
      // Decodificar el mensaje para eliminar caracteres de codificación
      const decodedMessage = decodeQuotedPrintable(message);
      
      // Obtener URL absoluta para los enlaces
      const issuesPageUrl = getAbsoluteUrl('/issues');
      
      // Formato mejorado para el correo electrónico
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background-color: #0f172a; padding: 15px; border-radius: 6px 6px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nueva Incidencia Asignada</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb; border-bottom: 1px solid #e0e0e0;">
            <p style="color: #64748b; margin-top: 0;">Fecha: ${currentDate}</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Se ha reportado una nueva incidencia que requiere de su atención. A continuación, se detallan los pormenores:
            </p>
            
            <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin-top: 0;">Descripción de la Incidencia:</h3>
              <p style="color: #334155; line-height: 1.6;">${decodedMessage}</p>
            </div>
            
            ${imageUrl ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin-bottom: 10px;">Imagen Adjunta:</h3>
              <img src="${imageUrl}" alt="Imagen de la incidencia" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            </div>
            ` : ''}
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 4px;">
              <h3 style="color: #1e40af; margin-top: 0;">Próximos Pasos:</h3>
              <ol style="color: #1e3a8a; line-height: 1.6;">
                <li>Revisar la incidencia en detalle</li>
                <li>Evaluar la situación y determinar un plan de acción</li>
                <li>Actualizar el estado de la incidencia en el sistema</li>
                <li>Documentar las medidas tomadas</li>
              </ol>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center;">
            <a href="${issuesPageUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver en la Plataforma</a>
          </div>
          
          <div style="padding: 15px; background-color: #f1f5f9; border-radius: 0 0 6px 6px; font-size: 12px; color: #64748b; text-align: center;">
            <p>Este es un mensaje automático del sistema de gestión de incidencias.</p>
            <p>Por favor, no responda directamente a este correo.</p>
          </div>
        </div>
      `;

      await sendEmail(
        email,
        "Nueva incidencia asignada - Acción requerida",
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
