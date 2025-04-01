
// Enhanced logging utility for email service
export const logger = {
  log: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📧 INFO: ${message}`, ...args);
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 🚨 ERROR: ${message}`);
    
    if (error) {
      if (error instanceof Error) {
        console.error(`[${timestamp}] 🚨 ERROR DETAILS: ${error.message}`);
        console.error(`[${timestamp}] 🚨 STACK: ${error.stack}`);
      } else {
        console.error(`[${timestamp}] 🚨 ERROR DETAILS:`, error);
      }
    }
  },
  warn: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️ WARN: ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] ℹ️ INFO: ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (Deno?.env?.get('DEBUG') === 'true') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] 🔍 DEBUG: ${message}`, ...args);
    }
  }
};
