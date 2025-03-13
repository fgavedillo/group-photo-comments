
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
      // Validar el email del destinatario
      if (!templateParams.to_email) {
        throw new Error('El email del destinatario es requerido');
      }

      // Validar la clave pública
      if (!config.publicKey || config.publicKey.length < 10) {
        throw new Error('La clave pública de EmailJS es inválida');
      }

      // Asegurar que los IDs sean correctos
      const serviceId = 'service_yz5opji'; // Siempre usar este ID de servicio
      const templateId = config.templateId || 'template_ah9tqde'; // Usar el ID proporcionado o el predeterminado
      const publicKey = config.publicKey || 'RKDqUO9tTPGJrGKLQ'; // Usar la clave proporcionada o la predeterminada

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
        } else if (typeof value === 'object' && value !== null) {
          // Verificar si es una instancia de Date
          if (value instanceof Date) {
            stringValue = value.toISOString();
          } else {
            // Otros objetos convertir a JSON
            try {
              stringValue = JSON.stringify(value);
            } catch (e) {
              console.warn(`No se pudo convertir el objeto en el campo ${key} a string`);
              continue;
            }
          }
        } else {
          stringValue = String(value);
        }
        
        // Solo incluir valores no vacíos
        if (stringValue.length > 0) {
          cleanParams[key] = stringValue;
        }
      }
      
      console.log('Enviando email con EmailJS. Parámetros:', cleanParams);
      console.log('Configuración:', {
        serviceId,
        templateId,
        publicKey: '********' // Por seguridad no mostramos la clave
      });

      // Inicializar EmailJS antes de enviar
      emailjs.init(publicKey);

      // Enviar el email usando la API de EmailJS
      const result = await emailjs.send(
        serviceId,
        templateId,
        cleanParams
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
