
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

// IMPORTANTE: Estas constantes son las ÚNICAS correctas para EmailJS - NUNCA CAMBIAR ESTOS VALORES
const DEFAULT_SERVICE_ID = 'service_yz5opji'; // ID DE SERVICIO VERIFICADO
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

      // IMPORTANTE: FORZAR siempre el uso del ID de servicio correcto
      // independientemente de lo que se pase como parámetro
      if (config.serviceId !== DEFAULT_SERVICE_ID) {
        console.warn(`⚠️ ID de servicio incorrecto proporcionado: "${config.serviceId}". Se FUERZA el uso del ID correcto: "${DEFAULT_SERVICE_ID}"`);
      }
      
      // SIEMPRE sobreescribir el serviceId con el valor correcto
      // Esto es crítico: ignoramos completamente el valor proporcionado
      const serviceId = DEFAULT_SERVICE_ID;
      
      // Validar el ID de la plantilla y forzar el uso del correcto
      if (config.templateId !== DEFAULT_TEMPLATE_ID) {
        console.warn(`⚠️ ID de plantilla incorrecto: "${config.templateId}". Se utilizará el correcto: "${DEFAULT_TEMPLATE_ID}"`);
      }
      
      // SIEMPRE sobreescribir el templateId con el valor correcto
      const templateId = DEFAULT_TEMPLATE_ID;

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
      console.log('⚠️ VERIFICACIÓN DE SEGURIDAD ⚠️');
      console.log('ServiceID que se usará:', serviceId);
      console.log('TemplateID que se usará:', templateId);
      console.log('Configuración finalizada:', {
        serviceId: serviceId, // Mostrar el ID que realmente se usará
        templateId: templateId,
        publicKey: '********' // Por seguridad no mostramos la clave
      });

      // Mostrar información detallada para diagnóstico
      console.log('Longitud de los parámetros:', JSON.stringify(cleanParams).length);
      if (cleanParams.image_base64) {
        console.log('Longitud de la imagen base64:', cleanParams.image_base64.length);
      }

      try {
        console.log('📧 Iniciando envío de email con EmailJS...');
        console.log('📧 Service ID FORZADO a:', serviceId);
        
        // IMPORTANTE: Usar directamente las constantes en el método send
        // NO usar variables intermedias que puedan ser alteradas
        const result = await emailjs.send(
          DEFAULT_SERVICE_ID, // Usar directamente la constante correcta
          DEFAULT_TEMPLATE_ID, // Usar directamente la constante correcta
          cleanParams,
          config.publicKey // Este valor podría venir de una variable
        );
        
        console.log('EmailJS response:', result);
        return result;
      } catch (emailJsError) {
        console.error('Error específico de EmailJS:', emailJsError);
        
        // Mejorar el mensaje de error para problemas comunes
        if (emailJsError instanceof Error) {
          if (emailJsError.message.includes("service_id not found")) {
            throw new Error(`El servicio con ID "${DEFAULT_SERVICE_ID}" no existe. Verifique su cuenta de EmailJS y cree un nuevo servicio con este ID exacto.`);
          }
          if (emailJsError.message.includes("template_id not found")) {
            throw new Error(`La plantilla con ID "${DEFAULT_TEMPLATE_ID}" no existe. Verifique su cuenta de EmailJS y cree una nueva plantilla con este ID exacto.`);
          }
          if (emailJsError.message.includes("user_id invalid")) {
            throw new Error(`La clave pública (User ID: "${config.publicKey.substring(0, 4)}...") no es válida. Verifique en su cuenta de EmailJS.`);
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
