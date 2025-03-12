
import { useState } from 'react';
import emailjs from '@emailjs/browser';

interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export const useEmailJS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (config: EmailJSConfig, templateParams: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!templateParams.to_email) {
        throw new Error('El email del destinatario es requerido');
      }

      // Asegurarse de que las variables coincidan exactamente con las que espera la plantilla Handlebars
      const validatedParams = {
        // Variables básicas que aparecen en la plantilla
        date: templateParams.date?.toString() || '',
        message: templateParams.message?.toString() || '',
        image_url: templateParams.image_url?.toString() || '',
        issues_url: templateParams.issues_url?.toString() || '',
        to_email: templateParams.to_email?.toString() || '',
      };

      console.log('Enviando con parámetros validados:', validatedParams);

      const result = await emailjs.send(
        config.serviceId,
        config.templateId,
        validatedParams,
        config.publicKey
      );
      
      console.log('EmailJS response:', result);
      return result;
    } catch (err) {
      console.error('Error en EmailJS:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar el email');
      throw err;
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
