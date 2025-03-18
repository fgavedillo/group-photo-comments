
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
      // Enhanced email validation - critical fix
      if (!templateParams.to_email || !validateEmail(templateParams.to_email)) {
        throw new Error(`El email del destinatario '${templateParams.to_email}' no es válido o está vacío`);
      }

      // Initialize EmailJS with the public key
      emailjs.init(config.publicKey);
      
      console.log('Sending email via EmailJS to:', templateParams.to_email);
      
      // Create a properly formatted email object for EmailJS
      const emailJSParams = {
        ...templateParams,
        to_email: templateParams.to_email.trim(), // Ensure there are no trailing spaces
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
      
      // Enhanced error handling for EmailJS
      if (error.status === 422) {
        if (error.text?.includes("recipients address is empty")) {
          setError(`Error: La dirección de correo "${templateParams.to_email}" no fue reconocida por EmailJS. Verifique que sea un correo válido.`);
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

  // Email validation function
  const validateEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    email = email.trim();
    if (email === '') return false;
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return {
    sendEmail,
    isLoading,
    error
  };
};
