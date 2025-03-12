
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
      // Validar el email del destinatario
      if (!templateParams.to_email) {
        throw new Error('El email del destinatario es requerido');
      }

      // Validar la clave pública
      const publicKey = config.publicKey.trim();
      if (!publicKey) {
        throw new Error('La clave pública de EmailJS es requerida');
      }

      // Crear un objeto de parámetros limpio
      const cleanParams: Record<string, string> = {};
      
      // Procesar y convertir cada parámetro a string válido
      for (const [key, value] of Object.entries(templateParams)) {
        // Omitir valores null/undefined/vacíos
        if (value === null || value === undefined) {
          continue;
        }
        
        // Convertir a string adecuadamente según el tipo
        let stringValue = '';
        
        if (typeof value === 'string') {
          stringValue = value.trim();
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          stringValue = String(value);
        } else if (value instanceof Date) {
          stringValue = value.toISOString();
        } else if (typeof value === 'object') {
          try {
            stringValue = JSON.stringify(value);
          } catch (e) {
            console.warn(`No se pudo convertir el objeto en el campo ${key} a string`);
            continue;
          }
        } else {
          try {
            stringValue = String(value);
          } catch (e) {
            console.warn(`No se pudo convertir el valor en el campo ${key} a string`);
            continue;
          }
        }
        
        // Solo incluir valores no vacíos
        if (stringValue.length > 0) {
          cleanParams[key] = stringValue;
        }
      }
      
      // Validar URL de imagen específicamente
      if (cleanParams.image_url) {
        try {
          new URL(cleanParams.image_url);
        } catch (e) {
          console.warn('URL de imagen inválida, omitiendo:', cleanParams.image_url);
          delete cleanParams.image_url;
        }
      }
      
      console.log('Enviando email con EmailJS. Parámetros:', cleanParams);
      console.log('Configuración:', {
        serviceId: config.serviceId,
        templateId: config.templateId,
        publicKey: publicKey.substring(0, 5) + '...' // Solo mostrar parte de la clave por seguridad
      });

      // Corrección importante: asegurar que la clave pública esté completa
      const result = await emailjs.send(
        config.serviceId,
        config.templateId,
        cleanParams,
        publicKey
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
