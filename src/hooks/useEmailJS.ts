
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
      // Validar que todas las variables necesarias están presentes
      if (!templateParams.to_email) {
        throw new Error('El email del destinatario es requerido');
      }

      // EmailJS requiere que todos los valores sean strings
      const validatedParams = Object.entries(templateParams).reduce((acc, [key, value]) => {
        acc[key] = value?.toString() || '';
        return acc;
      }, {} as Record<string, string>);

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
