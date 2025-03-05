
export interface Attachment {
  filename: string;
  content: string;
  type: string;
  encoding?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
  requestId: string;
  cc?: string[];
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  elapsed?: string;
  messageId?: string;
  error?: {
    message: string;
    code: string;
    details?: string;
  };
}

// Función para validar datos de email
export function validateEmailPayload(payload: any): { success: true; data: SendEmailRequest } | { success: false; error: string } {
  // Validar que exista la dirección de destino
  if (!payload.to) {
    return { success: false, error: "Falta el campo 'to' (destinatario)" };
  }

  // Validar el formato básico del email (simple)
  if (!payload.to.includes('@')) {
    return { success: false, error: "El formato del email destinatario es inválido" };
  }

  // Validar que exista el asunto
  if (!payload.subject) {
    return { success: false, error: "Falta el campo 'subject' (asunto)" };
  }

  // Validar que exista al menos contenido HTML o texto
  if (!payload.html && !payload.text) {
    return { success: false, error: "Debe proporcionar 'html' o 'text' como contenido del correo" };
  }

  // Asignar un ID de solicitud si no existe
  if (!payload.requestId) {
    payload.requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Todos los datos son válidos
  return { 
    success: true, 
    data: {
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments,
      requestId: payload.requestId,
      cc: payload.cc
    } 
  };
}
