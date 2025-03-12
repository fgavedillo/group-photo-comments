import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEmailJS, EmailJSTemplateParams } from "@/hooks/useEmailJS";
import { Issue } from "@/types/issue";
import { compressImageToBase64 } from "@/utils/imageCompression";

// ⚠️ IMPORTANTE: NO MODIFICAR ESTOS VALORES ⚠️
// Estos IDs son los correctos y verificados para EmailJS
const CORRECT_SERVICE_ID = 'service_yz5opji';
const CORRECT_TEMPLATE_ID = 'template_ah9tqde';
const CORRECT_PUBLIC_KEY = 'RKDqUO9tTPGJrGKLQ';

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  message: string;
  imageUrl?: string;
  issue?: Issue;
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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
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
      setIsProcessingImage(true);
      const toEmail = email.trim();
      console.log("💌 Preparando envío de email a:", toEmail);
      console.log("🔐 VERIFICANDO CONSTANTES:");
      console.log("✅ SERVICE_ID:", CORRECT_SERVICE_ID);
      console.log("✅ TEMPLATE_ID:", CORRECT_TEMPLATE_ID);
      console.log("✅ PUBLIC_KEY:", CORRECT_PUBLIC_KEY);
      
      // Formatear la fecha actual en español
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Procesar imagen si existe
      let imageBase64 = null;
      if (imageUrl) {
        try {
          // Intentar convertir la URL de la imagen a base64
          console.log("🖼️ Procesando imagen para email:", imageUrl);
          
          // Hacer fetch de la imagen y convertirla a File para comprimirla
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const imageFile = new File([blob], "issue-image.jpg", { type: blob.type });
          
          // Comprimir la imagen
          imageBase64 = await compressImageToBase64(imageFile);
          
          if (imageBase64) {
            console.log("✅ Imagen convertida a base64 y comprimida correctamente");
            // Verificar tamaño de la imagen después de comprimir
            console.log("📏 Tamaño de la imagen en base64:", Math.round(imageBase64.length / 1024), "KB");
            
            // Si la imagen sigue siendo muy grande (más de 500KB), intentar comprimirla más
            if (imageBase64.length > 500000) { // 500KB
              console.warn("⚠️ La imagen es demasiado grande, se enviará sin imagen");
              imageBase64 = null;
            }
          } else {
            console.warn("⚠️ No se pudo procesar la imagen a base64");
          }
        } catch (imgError) {
          console.error("❌ Error al procesar la imagen:", imgError);
          // Continuar sin la imagen
          imageBase64 = null;
        }
      }

      // Asegurar que todos los campos estén definidos con valores por defecto
      const templateParams: EmailJSTemplateParams = {
        to_name: "Usuario",  
        to_email: toEmail,   
        from_name: "Sistema de Incidencias",
        date: currentDate,
        message: message || "",
        // Asegurar que todos los campos opcionales tengan un valor por defecto
        area: issue?.area || "",
        responsable: issue?.responsable || "",
        status: issue?.status || "",
        security_improvement: issue?.securityImprovement || "",
        action_plan: issue?.actionPlan || "",
        id: issue?.id ? String(issue.id) : "",
        // Añadir la imagen en base64 si existe
        image_base64: imageBase64 || "",
        // Mantener la URL de la imagen como respaldo
        image_url: imageUrl || ""
      };

      console.log("🚨 USANDO ESTRICTAMENTE ESTOS VALORES:");
      console.log("🔒 Service ID:", CORRECT_SERVICE_ID);
      console.log("🔒 Template ID:", CORRECT_TEMPLATE_ID);
      console.log("🔒 Public Key:", CORRECT_PUBLIC_KEY);
      
      // Enviar el email usando el hook personalizado
      // IMPORTANTE: Aquí NO se deben usar variables para los IDs, usamos las constantes directamente
      const result = await sendEmail(
        {
          serviceId: CORRECT_SERVICE_ID,
          templateId: CORRECT_TEMPLATE_ID,
          publicKey: CORRECT_PUBLIC_KEY,
        },
        templateParams
      );

      console.log("✅ Resultado del envío de email:", result);

      toast({
        title: "Correo enviado",
        description: `Se ha enviado la notificación a ${toEmail} exitosamente`
      });
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      
      let mensajeError = "No se pudo enviar el correo";
      if (error instanceof Error) {
        mensajeError = error.message;
        console.error('🔍 Detalles del error:', error.stack);
      }
      
      toast({
        title: "Error",
        description: mensajeError,
        variant: "destructive"
      });
    } finally {
      setIsProcessingImage(false);
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
          disabled={isLoading || isProcessingImage}
        >
          {isLoading || isProcessingImage ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {isProcessingImage ? 'Procesando...' : 'Enviando...'}
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
