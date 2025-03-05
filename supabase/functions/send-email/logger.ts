
// Utilidad de registro para el servicio de correo electrónico
export const logger = {
  log: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📧 INFO: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 🚨 ERROR: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️ WARN: ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] ℹ️ INFO: ${message}`, ...args);
  }
};
