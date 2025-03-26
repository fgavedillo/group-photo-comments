
// Define the API key directly (for now)
const RESEND_API_KEY = 're_aTq2dBeF_FXKGPGc3ViQGpRm7stAY3iJ9';

console.log('******************************************');
console.log('LOADED: useReportSender.ts - VERSION TEST 123');
console.log('******************************************');

export const sendReport = async (reportId: string, recipients: string[]) => {
  console.log('Función de envío de reportes deshabilitada', { reportId, recipients });
  
  // Return a simulated response
  return {
    success: true,
    message: 'Funcionalidad de envío de reportes deshabilitada temporalmente',
    data: null
  };
};

export default sendReport;
