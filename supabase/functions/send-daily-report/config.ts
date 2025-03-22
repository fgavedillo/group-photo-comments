
export const APP_URL = "https://incidencias-gestion.lovable.dev";

export const RECIPIENT_EMAILS = [
  "francisco.garcia@lingotes.com",
  // El usuario puede agregar más destinatarios según sea necesario
];

// Cambio del remitente para mostrar el nombre del sistema
export const EMAIL_SENDER = "Sistema de Gestión de Incidencias <francisco.garcia@lingotes.com>";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tiempo máximo de ejecución para la función (en milisegundos)
export const MAX_EXECUTION_TIME = 50000; // 50 segundos (aumentado para dar más tiempo al proceso de envío)

// Configuración para las solicitudes
export const REQUEST_TIMEOUT = 15000; // 15 segundos (aumentado para dar más tiempo a las operaciones de correo)

// URL completa para la función send-email
export const SEND_EMAIL_FUNCTION_URL = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email";
