
export const APP_URL = "https://incidencias-gestion.lovable.dev";

export const RECIPIENT_EMAILS = [
  "francisco.garcia@lingotes.com",
  "test@example.com", // Adding a test recipient
  "notifications@example.com", // Adding another test recipient
  // Añade aquí más destinatarios por defecto
];

// Cambio del remitente para mostrar el nombre del sistema
export const EMAIL_SENDER = "Sistema de Gestión de Incidencias <francisco.garcia@lingotes.com>";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tiempo máximo de ejecución para la función (en milisegundos)
export const MAX_EXECUTION_TIME = 180000; // 3 minutos

// Configuración para las solicitudes
export const REQUEST_TIMEOUT = 60000; // 1 minuto

// URL completa para la función send-email
export const SEND_EMAIL_FUNCTION_URL = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email";
