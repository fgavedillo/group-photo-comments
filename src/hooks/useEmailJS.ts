
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

      // Simplificar los parámetros para evitar corrupción
      // EmailJS espera strings simples para todas las variables
      const cleanParams: Record<string, string> = {};
      
      // Convertir todos los valores a strings y eliminar undefined/null
      Object.keys(templateParams).forEach(key => {
        const value = templateParams[key];
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
      
      console.log('Enviando con parámetros limpios:', cleanParams);

      const result = await emailjs.send(
        config.serviceId,
        config.templateId,
        cleanParams,
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
