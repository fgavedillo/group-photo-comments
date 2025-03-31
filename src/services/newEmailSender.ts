
/**
 * Servicio simplificado para enviar emails directamente utilizando Resend
 */
export const sendEmailDirectly = async (recipients: string[], subject: string, htmlContent: string) => {
  console.log('Ejecutando: sendEmailDirectly', { recipients });
  
  try {
    // Validar destinatarios
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('No se proporcionaron destinatarios válidos');
    }
    
    // Filtrar direcciones vacías o inválidas
    const validRecipients = recipients.filter(email => {
      return email && typeof email === 'string' && email.trim() !== '' && email.includes('@');
    });
    
    if (validRecipients.length === 0) {
      throw new Error('Todos los destinatarios proporcionados son inválidos');
    }
    
    // Clave API de Resend
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error('VITE_RESEND_API_KEY no está configurada en las variables de entorno');
    }
    
    // Remitente verificado en Resend
    const FROM_EMAIL = 'Sistema de Gestión <info@prlconecta.es>';
    console.log('Usando dirección de remitente:', FROM_EMAIL);
    
    // ID único para seguimiento
    const requestId = `direct-${Date.now()}`;
    
    // Llamada directa a API de Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: validRecipients,
        subject: subject,
        html: htmlContent,
        // Agregar referencia única
        headers: {
          "X-Entity-Ref-ID": requestId
        },
        tags: [
          { name: "source", value: "prlconecta" },
          { name: "category", value: "transactional" }
        ]
      }),
    });

    const data = await response.json();
    console.log('Respuesta de Resend:', data);
    
    if (!response.ok) {
      console.error('Error detallado de Resend:', JSON.stringify(data));
      throw new Error(`Error Resend: ${JSON.stringify(data)}`);
    }

    return {
      success: true,
      data: data,
      recipients: validRecipients
    };
  } catch (error) {
    console.error('Error completo al enviar email:', error);
    throw error;
  }
}; 
