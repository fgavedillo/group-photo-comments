
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
      // Validar el email del destinatario - sin limpiarlo primero, usar el valor original
      const emailToValidate = templateParams.to_email;
      
      if (!emailToValidate) {
        throw new Error('El email del destinatario es requerido');
      }

      // Validar que el email tenga formato básico (contiene @)
      if (!emailToValidate.includes('@')) {
        throw new Error(`Email inválido: ${emailToValidate}`);
      }

      // Validar la clave pública
      if (!config.publicKey || config.publicKey.length < 10) {
        throw new Error('La clave pública de EmailJS es inválida');
      }

      // Asegurar que los IDs sean correctos
      const serviceId = config.serviceId || 'service_yz5opji'; // Usar el ID proporcionado o el predeterminado
      const templateId = config.templateId || 'template_ah9tqde'; // Usar el ID proporcionado o el predeterminado
      const publicKey = config.publicKey || 'RKDqUO9tTPGJrGKLQ'; // Usar la clave proporcionada o la predeterminada

      // Crear un objeto de parámetros limpio y conservar los valores originales sin modificar
      const cleanParams: Record<string, string> = {};
      
      // Procesar cada parámetro manteniendo los valores originales siempre que sea posible
      for (const [key, value] of Object.entries(templateParams)) {
        // Omitir valores null/undefined
        if (value === null || value === undefined) {
          continue;
        }
        
        // Conservar los strings originales sin trim ni modificaciones
        if (typeof value === 'string') {
          cleanParams[key] = value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          cleanParams[key] = String(value);
        } else if (typeof value === 'object') {
          // Para objetos Date
          if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value as unknown as number)) {
            cleanParams[key] = (value as Date).toISOString();
          } else {
            // Otros objetos convertir a JSON
            try {
              cleanParams[key] = JSON.stringify(value);
            } catch (e) {
              console.warn(`No se pudo convertir el objeto en el campo ${key} a string`);
              continue;
            }
          }
        } else {
          cleanParams[key] = String(value);
        }
      }
      
      console.log('Enviando email con EmailJS. Parámetros:', cleanParams);
      console.log('Configuración:', {
        serviceId,
        templateId,
        publicKey: '********' // Por seguridad no mostramos la clave
      });

      // Inicializar EmailJS para este envío
      emailjs.init(publicKey);

      // Enviar el email usando la API de EmailJS - modo directo
      const result = await emailjs.send(
        serviceId,
        templateId,
        cleanParams
      );
      
      console.log('EmailJS response:', result);
      return result;
    } catch (error: any) {
      console.error('Error en EmailJS:', error);
      
      // Manejo específico de errores de EmailJS
      if (error.status === 422) {
        if (error.text?.includes("recipients address is empty")) {
          // Problema específico con el email, intentaremos solucionar el formato
          const originalEmail = templateParams.to_email;
          setError(`Error: El servidor de EmailJS rechazó la dirección: ${originalEmail}. Intente con otro formato o proveedor de email.`);
        } else if (error.text?.includes("no template")) {
          setError(`La plantilla '${config.templateId}' no existe o no es accesible. Verifique el ID de plantilla.`);
        } else {
          setError(`EmailJS rechazó la solicitud: ${error.text}`);
        }
      } else if (error.status === 401 || error.status === 403) {
        setError(`Error de autenticación en EmailJS. Verifique su clave pública y serviceId.`);
      } else if (error.status === 429) {
        setError(`Se ha excedido el límite de solicitudes a EmailJS. Intente más tarde.`);
      } else {
        setError(error instanceof Error ? error.message : 'Error al enviar el email');
      }
      
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
