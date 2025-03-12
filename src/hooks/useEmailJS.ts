
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

      // Ignorar los valores proporcionados en config y usar SIEMPRE los valores por defecto
      // Logging de verificación
      console.log('⚠️ IGNORANDO valores proporcionados en config:');
      console.log('❌ ServiceID proporcionado:', config.serviceId, '-> Usando FORZOSAMENTE:', DEFAULT_SERVICE_ID);
      console.log('❌ TemplateID proporcionado:', config.templateId, '-> Usando FORZOSAMENTE:', DEFAULT_TEMPLATE_ID);
      console.log('❌ PublicKey proporcionada:', config.publicKey, '-> Usando FORZOSAMENTE:', DEFAULT_PUBLIC_KEY);

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
      console.log('SIEMPRE usando ServiceID:', DEFAULT_SERVICE_ID);
      console.log('SIEMPRE usando TemplateID:', DEFAULT_TEMPLATE_ID);
      console.log('SIEMPRE usando PublicKey:', DEFAULT_PUBLIC_KEY);

      try {
        console.log('📧 Iniciando envío de email con EmailJS...');
        
        // IMPORTANTE: Usar DIRECTAMENTE las constantes en el método send
        // NO usar config, ya que puede contener valores incorrectos
        const result = await emailjs.send(
          DEFAULT_SERVICE_ID, // FORZAR el ID de servicio correcto
          DEFAULT_TEMPLATE_ID, // FORZAR el ID de plantilla correcto
          cleanParams,
          DEFAULT_PUBLIC_KEY // FORZAR la clave pública correcta
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
            throw new Error(`La clave pública (User ID: "${DEFAULT_PUBLIC_KEY.substring(0, 4)}...") no es válida. Verifique en su cuenta de EmailJS.`);
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
