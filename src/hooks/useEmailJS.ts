
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
      console.log('Configuración:', {
        serviceId: config.serviceId,
        templateId: config.templateId,
        publicKey: '********' // Por seguridad no mostramos la clave
      });

      const template = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Notificación de Incidencia</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  background-color: #f4f7fa;
                  color: #1e293b;
                  margin: 0;
                  padding: 20px;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background-color: #003366;
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-bottom: 4px solid #0066cc;
              }
              .header h2 {
                  margin: 0;
                  font-size: 24px;
                  letter-spacing: 0.5px;
              }
              .header p {
                  margin: 10px 0 0;
                  opacity: 0.9;
                  font-size: 16px;
              }
              .content {
                  padding: 30px;
                  background-color: #ffffff;
              }
              .greeting {
                  font-size: 18px;
                  color: #1e293b;
                  margin-bottom: 20px;
              }
              .info-section {
                  background-color: #f8fafc;
                  padding: 25px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border-left: 4px solid #0066cc;
              }
              .field {
                  margin-bottom: 15px;
                  padding-bottom: 15px;
                  border-bottom: 1px solid #e2e8f0;
              }
              .field:last-child {
                  border-bottom: none;
                  margin-bottom: 0;
                  padding-bottom: 0;
              }
              .label {
                  font-weight: 600;
                  color: #0066cc;
                  display: block;
                  margin-bottom: 5px;
              }
              .value {
                  color: #334155;
                  line-height: 1.6;
              }
              .notice {
                  background-color: #fff7ed;
                  border-left: 4px solid #f97316;
                  padding: 15px;
                  margin: 20px 0;
                  color: #9a3412;
                  font-size: 14px;
                  border-radius: 4px;
              }
              .footer {
                  text-align: center;
                  padding: 25px;
                  background-color: #003366;
                  color: #ffffff;
                  border-top: 4px solid #0066cc;
              }
              .footer p {
                  margin: 0;
                  opacity: 0.9;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>Notificación de Incidencia</h2>
                  <p>ID: {{id}}</p>
              </div>
              
              <div class="content">
                  <div class="greeting">
                      <p>Hola {{to_name}},</p>
                      <p>Se ha registrado una actualización en el sistema de incidencias con fecha {{date}}.</p>
                  </div>
                  
                  <div class="info-section">
                      <div class="field">
                          <span class="label">Estado</span>
                          <div class="value">{{status}}</div>
                      </div>
                      
                      <div class="field">
                          <span class="label">Área</span>
                          <div class="value">{{area}}</div>
                      </div>
                      
                      <div class="field">
                          <span class="label">Responsable</span>
                          <div class="value">{{responsable}}</div>
                      </div>
                      
                      <div class="field">
                          <span class="label">Mensaje de la incidencia</span>
                          <div class="value">{{message}}</div>
                      </div>
                      
                      <div class="field">
                          <span class="label">Plan de acción</span>
                          <div class="value">{{action_plan}}</div>
                      </div>
                      
                      <div class="field">
                          <span class="label">Mejora de seguridad</span>
                          <div class="value">{{security_improvement}}</div>
                      </div>
                  </div>
                  
                  <div class="notice">
                      <p>Por favor, no responda a este correo electrónico automático.</p>
                  </div>
              </div>
              
              <div class="footer">
                  <p>Atentamente,<br>{{from_name}}</p>
              </div>
          </div>
      </body>
      </html>
      `;

      console.log('Enviando email con EmailJS. Parámetros:', cleanParams);
      console.log('Configuración:', {
        serviceId: config.serviceId,
        templateId: config.templateId,
        publicKey: '********' // Por seguridad no mostramos la clave
      });

      const result = await emailjs.send(
        config.serviceId,
        config.templateId,
        cleanParams,
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
