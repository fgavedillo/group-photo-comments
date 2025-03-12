
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
  image_base64?: string; // Añadimos el nuevo campo para imágenes en base64
  area?: string;
  responsable?: string;
  status?: string;
  security_improvement?: string;
  action_plan?: string;
  id?: string;
  [key: string]: string | undefined;
}

// Constantes para configuration de EmailJS
// Si cambias estos valores, asegúrate que corresponden con tu cuenta de EmailJS
const DEFAULT_SERVICE_ID = 'service_yz5opji';
const DEFAULT_TEMPLATE_ID = 'template_ah9tqde';
const DEFAULT_PUBLIC_KEY = 'RKDqUO9tTPGJrGKLQ';

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

      // Validar el service ID y asegurarse de que sea el correcto
      if (!config.serviceId) {
        throw new Error('El ID del servicio de EmailJS es requerido');
      }

      // Verificar si el serviceId proporcionado es válido
      // Se asegura que usemos uno de los servicios válidos
      const validServiceId = DEFAULT_SERVICE_ID;
      
      // Si el serviceId no coincide con ninguno de los válidos, usar el predeterminado
      if (config.serviceId !== validServiceId) {
        console.warn(`ID de servicio incorrecto: ${config.serviceId}. Se utilizará el ID correcto: ${validServiceId}`);
        config.serviceId = validServiceId;
      }

      // Validar el ID de la plantilla
      if (!config.templateId) {
        throw new Error('El ID de la plantilla de EmailJS es requerido');
      }

      // Verificar que el templateId sea válido
      if (config.templateId !== DEFAULT_TEMPLATE_ID) {
        console.warn(`ID de plantilla incorrecto: ${config.templateId}. Se utilizará el ID correcto: ${DEFAULT_TEMPLATE_ID}`);
        config.templateId = DEFAULT_TEMPLATE_ID;
      }

      // Crear un objeto de parámetros limpio con valores por defecto para campos vacíos
      const cleanParams: Record<string, string> = {};
      
      // Procesar y convertir cada parámetro a string válido
      for (const [key, value] of Object.entries(templateParams)) {
        // Asignar cadena vacía a valores null/undefined
        if (value === null || value === undefined) {
          cleanParams[key] = '';
          continue;
        }
        
        // Convertir a string adecuadamente según el tipo
        let stringValue = '';
        
        if (typeof value === 'string') {
          stringValue = value.trim();
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          stringValue = String(value);
        } else if (typeof value === 'object') {
          // Comprobar si es un objeto Date
          const isDate = Object.prototype.toString.call(value) === '[object Date]';
          if (isDate && !isNaN((value as Date).getTime())) {
            stringValue = (value as Date).toISOString();
          } else {
            // Otros objetos convertir a JSON
            try {
              stringValue = JSON.stringify(value);
            } catch (e) {
              console.warn(`No se pudo convertir el objeto en el campo ${key} a string`);
              stringValue = '';
            }
          }
        } else {
          stringValue = String(value);
        }
        
        // Siempre incluir el valor, incluso si está vacío
        cleanParams[key] = stringValue;
      }
      
      console.log('Enviando email con EmailJS. Parámetros:', cleanParams);
      console.log('Configuración finalizada:', {
        serviceId: config.serviceId,
        templateId: config.templateId,
        publicKey: '********' // Por seguridad no mostramos la clave
      });

      // Mostrar información detallada para diagnóstico
      console.log('Longitud de los parámetros:', JSON.stringify(cleanParams).length);
      if (cleanParams.image_base64) {
        console.log('Longitud de la imagen base64:', cleanParams.image_base64.length);
      }

      try {
        console.log('Iniciando envío de email con EmailJS...');
        const result = await emailjs.send(
          config.serviceId,
          config.templateId,
          cleanParams,
          config.publicKey
        );
        
        console.log('EmailJS response:', result);
        return result;
      } catch (emailJsError) {
        console.error('Error específico de EmailJS:', emailJsError);
        
        // Mejorar el mensaje de error para problemas comunes
        if (emailJsError instanceof Error) {
          if (emailJsError.message.includes("service_id not found")) {
            throw new Error(`El servicio con ID "${config.serviceId}" no existe. Verifique su cuenta de EmailJS y cree un nuevo servicio.`);
          }
          if (emailJsError.message.includes("template_id not found")) {
            throw new Error(`La plantilla con ID "${config.templateId}" no existe. Verifique su cuenta de EmailJS y cree una nueva plantilla.`);
          }
        }
        
        throw emailJsError;
      }
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
