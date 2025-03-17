
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

      // Validar que el email tenga formato básico (contiene @)
      if (!templateParams.to_email.includes('@')) {
        throw new Error(`Email inválido: ${templateParams.to_email}`);
      }

      // Validar la clave pública
      if (!config.publicKey || config.publicKey.length < 10) {
        throw new Error('La clave pública de EmailJS es inválida');
      }

      // Asegurar que los IDs sean correctos
      const serviceId = config.serviceId || 'service_yz5opji'; // Usar el ID proporcionado o el predeterminado
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
        } else if (typeof value === 'object') {
          // Verificar si es una instancia de Date usando otro método
          if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value as unknown as number)) {
            stringValue = (value as Date).toISOString();
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

      // Enviar el email usando la API de EmailJS - con manejo de errores detallado
      try {
        const result = await emailjs.send(
          serviceId,
          templateId,
          cleanParams
        );
        
        console.log('EmailJS response:', result);
        return result;
      } catch (emailJSError: any) {
        console.error('Error específico de EmailJS:', emailJSError);
        
        // Detectar errores comunes de EmailJS y proporcionar mensajes más claros
        if (emailJSError.status === 422) {
          if (emailJSError.text?.includes("recipients address is empty")) {
            throw new Error(`La dirección de correo del destinatario está vacía o no es válida: ${templateParams.to_email}`);
          } else if (emailJSError.text?.includes("no template")) {
            throw new Error(`La plantilla '${templateId}' no existe o no es accesible. Verifique el ID de la plantilla.`);
          }
        } else if (emailJSError.status === 401 || emailJSError.status === 403) {
          throw new Error(`Error de autenticación en EmailJS. Verifique su clave pública y serviceId.`);
        } else if (emailJSError.status === 429) {
          throw new Error(`Se ha excedido el límite de solicitudes a EmailJS. Intente más tarde.`);
        }
        
        // Si no es ninguno de los errores específicos, lanzar el error general
        throw emailJSError;
      }
    } catch (error: any) {
      console.error('Error en EmailJS:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar el email');
      throw error;
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
