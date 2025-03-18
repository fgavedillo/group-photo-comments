
import { useState } from 'react';
import emailjs from '@emailjs/browser';

interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Define la estructura para los parámetros de la plantilla
export interface EmailJSTemplateParams {
  to_name: string;
  to_email: string;
  from_name: string;
  date: string;
  message: string;
  issues_url?: string;
  image_url?: string;
  report_image?: string;
  table_image?: string;
  area?: string;
  responsable?: string;
  status?: string;
  security_improvement?: string;
  action_plan?: string;
  id?: string;
  [key: string]: string | undefined;
}

export const useEmailJS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (config: EmailJSConfig, templateParams: EmailJSTemplateParams) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate recipient email - critical fix
      if (!templateParams.to_email) {
        throw new Error('El email del destinatario es requerido');
      }

      // Initialize EmailJS with the public key
      emailjs.init(config.publicKey);
      
      console.log('Sending email via EmailJS to:', templateParams.to_email);
      
      // Create a separate email object for EmailJS that ensures the email is correctly formatted
      // The recipient field must be formatted properly for EmailJS
      const emailJSParams = {
        ...templateParams,
        to_email: templateParams.to_email.trim(), // Ensure there are no trailing spaces
        // Configure EmailJS to recognize this as a valid recipient field
        // Add any other required formatting here
      };
      
      console.log('EmailJS params:', emailJSParams);
      console.log('Using service:', config.serviceId, 'template:', config.templateId);

      // Send the email using EmailJS
      const result = await emailjs.send(
        config.serviceId,
        config.templateId,
        emailJSParams
      );
      
      console.log('EmailJS response:', result);
      return result;
    } catch (error: any) {
      console.error('Error en EmailJS:', error);
      
      // Specific error handling for EmailJS
      if (error.status === 422) {
        if (error.text?.includes("recipients address is empty")) {
          setError(`Error: La dirección "${templateParams.to_email}" no fue reconocida por EmailJS. Intente con otro formato.`);
        } else if (error.text?.includes("no template")) {
          setError(`La plantilla '${config.templateId}' no existe o no es accesible.`);
        } else {
          setError(`EmailJS rechazó la solicitud: ${error.text}`);
        }
      } else if (error.status === 401 || error.status === 403) {
        setError(`Error de autenticación en EmailJS. Verifique su clave pública.`);
      } else if (error.status === 429) {
        setError(`Se ha excedido el límite de solicitudes a EmailJS.`);
      } else {
        setError(error instanceof Error ? error.message : 'Error al enviar el email');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmail,
    isLoading,
    error
  };
};
