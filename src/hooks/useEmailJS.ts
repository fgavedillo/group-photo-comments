
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

      // Asegurar que las variables coincidan exactamente con las de la plantilla EmailJS
      // Nota: Observando la plantilla, los nombres de variables tienen dobles llaves {{variable}}
      const validatedParams = {
        // Para "{{to_email}}" en el campo To Email
        to_email: templateParams.to_email?.toString() || '',
        
        // Para "{{date}}" en la plantilla
        date: templateParams.date?.toString() || '',
        
        // Para "{{message}}" en la plantilla
        message: templateParams.message?.toString() || '',
        
        // Para "{{#if image_url}}" en la plantilla (condicional)
        image_url: templateParams.image_url?.toString() || '',
        
        // Para "{{issues_url}}" usado en el botón "Ver Detalles"
        issues_url: templateParams.issues_url?.toString() || '',
        
        // Estas variables parecen estar en la configuración de EmailJS basado en la imagen
        title: 'Nueva Incidencia Asignada',  // Posible variable de asunto
        email: templateParams.to_email?.toString() || '',  // Para campo de correo
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
