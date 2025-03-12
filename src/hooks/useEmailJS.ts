
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

      // Verificar que la clave pública esté completa
      const publicKey = config.publicKey.trim();
      if (!publicKey || publicKey.length < 20) {
        throw new Error('La clave pública de EmailJS es inválida');
      }

      // Crear un objeto de parámetros limpio con solo strings
      const cleanParams: Record<string, string> = {};
      
      // Procesar cada parámetro para asegurar que sea un string válido
      Object.entries(templateParams).forEach(([key, value]) => {
        // Omitir valores null/undefined
        if (value === null || value === undefined) {
          return;
        }
        
        // Convertir a string y sanitizar
        let stringValue = '';
        
        if (typeof value === 'string') {
          stringValue = value.trim();
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          stringValue = String(value);
        } else if (value instanceof Date) {
          stringValue = value.toISOString();
        } else if (typeof value === 'object') {
          try {
            // Intentar convertir objetos a JSON string
            stringValue = JSON.stringify(value);
          } catch (e) {
            console.warn(`No se pudo convertir el objeto en el campo ${key} a string`);
            return; // Omitir este campo
          }
        } else {
          // Usar toString() como fallback
          try {
            stringValue = String(value);
          } catch (e) {
            console.warn(`No se pudo convertir el valor en el campo ${key} a string`);
            return; // Omitir este campo
          }
        }
        
        // Si después de todo el valor es vacío, no lo incluimos
        if (stringValue.length === 0) {
          return;
        }
        
        cleanParams[key] = stringValue;
      });
      
      // Validar URL de imagen específicamente
      if (cleanParams.image_url) {
        try {
          new URL(cleanParams.image_url);
        } catch (e) {
          console.warn('URL de imagen inválida, omitiendo:', cleanParams.image_url);
          delete cleanParams.image_url;
        }
      }
      
      console.log('Enviando con parámetros limpios:', cleanParams);

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
