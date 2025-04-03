console.log('LOADED: newEmailSender.ts');

export const sendEmailDirectly = async (recipients: string[], subject: string, reportHtml: string) => {
  console.log('EXECUTING: sendEmailDirectly', { recipients });
  
  try {
    const RESEND_API_KEY = 're_aTq2dBeF_FXKGPGc3ViQGpRm7stAY3iJ9';
    
    // Llamada directa a Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sistema de Gestión <onboarding@resend.dev>',
        to: recipients,
        subject: subject,
        html: reportHtml,
      }),
    });

    const data = await response.json();
    console.log('Respuesta Resend:', data);
    
    if (!response.ok) {
      throw new Error(`Error Resend: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('Error completo:', error);
    throw error;
  }
}; 