
export class Logger {
  private requestId: string;
  
  constructor(requestId: string) {
    this.requestId = requestId;
  }
  
  info(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [RequestID:${this.requestId}] ${message}`;
    
    if (data) {
      console.log(formattedMessage, data);
    } else {
      console.log(formattedMessage);
    }
  }
  
  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [RequestID:${this.requestId}] ${message}`;
    
    if (error) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  }
}
