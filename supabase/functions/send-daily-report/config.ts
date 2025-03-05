
export const APP_URL = "https://incidencias-gestion.lovable.dev";

export const RECIPIENT_EMAILS = [
  "prevencionlingotes@gmail.com",
  "francisco.garcia@lingotes.com",
  // Añadir más destinatarios si es necesario
];

export const EMAIL_SENDER = "Sistema de Gestión de Incidencias <prevencionlingotes@gmail.com>";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tiempo máximo de ejecución para la función (en milisegundos)
export const MAX_EXECUTION_TIME = 25000; // 25 segundos

// Configuración para las solicitudes
export const REQUEST_TIMEOUT = 10000; // 10 segundos

// URL completa para la función send-email
export const SEND_EMAIL_FUNCTION_URL = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email";
