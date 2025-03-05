
// Importa el módulo Deno.serve
import { corsHeaders, handleCors } from './cors.ts';
import { logger } from './logger.ts';
import { validateEmailPayload } from './types.ts';
import { sendEmailWithGmail } from './emailService.ts';

// Handle incoming requests
Deno.serve(async (req) => {
  // CORS preflight check
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Solo permitir POST para enviar correos
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'Método no permitido', 
          message: 'Solo se permite el método POST para esta función'
        }),
        { 
          status: 405, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Obtener el cuerpo de la solicitud
    const requestData = await req.json();
    logger.log(`Solicitud recibida: ${JSON.stringify(requestData)}`);

    // Validar los datos del correo electrónico
    const validationResult = validateEmailPayload(requestData);
    if (!validationResult.success) {
      logger.error(`Error de validación: ${validationResult.error}`);
      return new Response(
        JSON.stringify({ 
          error: 'Datos inválidos', 
          message: validationResult.error
        }),
        { 
          status: 400, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Enviar el correo electrónico
    const emailResult = await sendEmailWithGmail(validationResult.data);

    return new Response(
      JSON.stringify(emailResult),
      { 
        status: emailResult.success ? 200 : 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    // Log del error
    logger.error('Error al procesar la solicitud', error);

    // Respuesta de error
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        message: error.message || 'Se produjo un error inesperado al procesar la solicitud'
      }),
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
