
console.log('LOADED: newEmailSender.ts');

export const sendEmailDirectly = async (recipients: string[], subject: string, reportHtml: string) => {
  console.log('EXECUTING: sendEmailDirectly', { recipients });
  
  try {
    const RESEND_API_KEY = 're_aTq2dBeF_FXKGPGc3ViQGpRm7stAY3iJ9';
    const FROM_EMAIL = 'Sistema de Gestión <info@prlconecta.es>';
    
    console.log('Using FROM email address:', FROM_EMAIL);
    
    // Llamada directa a Resend API con configuración explícita del remitente
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject: subject,
        html: reportHtml,
        // Establecer un ID de referencia único para esta solicitud
        headers: {
          "X-Entity-Ref-ID": `direct-${Date.now()}`
        },
        tags: [
          { name: "source", value: "prlconecta" },
          { name: "category", value: "transactional" },
          { name: "force_from", value: "true" }
        ]
      }),
    });

    const data = await response.json();
    console.log('Respuesta Resend:', data);
    
    if (!response.ok) {
      console.error('Error detallado de Resend:', JSON.stringify(data));
      throw new Error(`Error Resend: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('Error completo:', error);
    throw error;
  }
}; 
