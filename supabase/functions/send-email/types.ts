
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
