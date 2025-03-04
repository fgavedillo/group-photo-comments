
export interface EmailAttachment {
  filename: string;
  content: string;
  encoding?: string;
  type?: string;
  contentType?: string; // For SMTP compatibility
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  content?: string;
  html?: string;
  attachments?: EmailAttachment[];
  requestId?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  recipients?: string[];
  requestId?: string;
  elapsedTime?: string;
  error?: {
    message: string;
    stack?: string;
    details?: string;
  };
}
