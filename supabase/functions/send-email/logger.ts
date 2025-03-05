
// Class to handle logging with context and request IDs
export class Logger {
  log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      console.log(formattedMessage, data);
    } else {
      console.log(formattedMessage);
    }
  }
  
  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    if (error) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();
