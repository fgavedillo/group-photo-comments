import { useState } from 'react';
import { sendReport } from '../services/reportSender';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export function ReportSenderButton({ recipients, reportData }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await sendReport(recipients, reportData);
      // Mostrar mensaje de éxito
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de prueba
  const testEmail = async () => {
    try {
      const result = await sendReport(
        ['tu@email.com'], 
        { 
          test: true, 
          mensaje: 'Esto es una prueba de envío de reporte' 
        }
      );
      console.log('Correo enviado:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleSendReport}
        disabled={isLoading}
      >
        {isLoading ? 'Enviando...' : 'Enviar Reporte'}
      </button>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
} 