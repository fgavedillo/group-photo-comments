
import { useState } from 'react';
import emailjs from '@emailjs/browser';

// HARDCODED CORRECT VALUES - DO NOT CHANGE THESE!!!
const FORCE_SERVICE_ID = 'service_yz5opji'; // Correct service ID from EmailJS dashboard
const FORCE_TEMPLATE_ID = 'template_ah9tqde';
const FORCE_PUBLIC_KEY = 'RKDqUO9tTPGJrGKLQ';

// Define la estructura para los parámetros de la plantilla
export interface EmailJSTemplateParams {
  to_name: string;
  to_email: string;
  from_name: string;
  date: string;
  message: string;
  issues_url?: string;
  image_url?: string;
  image_base64?: string; // Campo para imágenes en base64
  area?: string;
  responsable?: string;
  status?: string;
  security_improvement?: string;
  action_plan?: string;
  id?: string;
  [key: string]: string | undefined;
}

// Interface removed to avoid any confusion (will be ignored anyway)
export const useEmailJS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Direct call function that completely bypasses any config params
  const sendEmail = async (
    _ignoredConfig: any, // Completely ignore any config passed in
    templateParams: EmailJSTemplateParams
  ) => {
    setIsLoading(true);
    setError(null);

    console.log('⚠️⚠️⚠️ BEGINNING EMAIL SEND OPERATION - FORCE VALUES ⚠️⚠️⚠️');
    console.log(`🔒 FORCING SERVICE_ID: ${FORCE_SERVICE_ID}`);
    console.log(`🔒 FORCING TEMPLATE_ID: ${FORCE_TEMPLATE_ID}`);
    console.log(`🔒 FORCING PUBLIC_KEY: ${FORCE_PUBLIC_KEY}`);

    try {
      if (!templateParams.to_email) {
        throw new Error('El email del destinatario es requerido');
      }

      // Create clean params
      const cleanParams: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(templateParams)) {
        if (value === null || value === undefined) {
          cleanParams[key] = '';
          continue;
        }
        
        let stringValue = '';
        
        if (typeof value === 'string') {
          stringValue = value.trim();
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          stringValue = String(value);
        } else if (typeof value === 'object') {
          const isDate = Object.prototype.toString.call(value) === '[object Date]';
          if (isDate && !isNaN((value as Date).getTime())) {
            stringValue = (value as Date).toISOString();
          } else {
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
        
        cleanParams[key] = stringValue;
      }

      // EXTREMELY IMPORTANT!!!
      // Initialize EmailJS directly with our hardcoded public key first
      // This overrides any previous initialization
      emailjs.init(FORCE_PUBLIC_KEY);
      
      console.log('📨 SENDING EMAIL WITH FORCED VALUES - FINAL CHECK:');
      console.log('SERVICE_ID:', FORCE_SERVICE_ID);
      console.log('TEMPLATE_ID:', FORCE_TEMPLATE_ID);
      console.log('PUBLIC_KEY:', FORCE_PUBLIC_KEY);
      console.log('PARAMS:', cleanParams);

      // Direct invocation with hardcoded values
      // Do not use variables that could be changed
      const result = await emailjs.send(
        FORCE_SERVICE_ID, 
        FORCE_TEMPLATE_ID,
        cleanParams
      );
      
      console.log('✅ EmailJS Response:', result);
      return result;
    } catch (err) {
      console.error('❌ EmailJS Error:', err);
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
