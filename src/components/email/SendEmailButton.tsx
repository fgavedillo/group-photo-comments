
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { queueEmail } from '../../services/emailQueueService';

const SendEmailButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);

  const generateReport = async () => {
    // Implementación simulada
    return "<h1>Reporte de Incidencias</h1><p>Este es un reporte generado automáticamente.</p>";
  };

  const handleSendReport = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar error anterior
      
      // Verificar que hay destinatarios
      if (!recipients || recipients.length === 0) {
        throw new Error('Por favor, añade al menos un destinatario');
      }

      const report = await generateReport();
      console.log('Reporte generado correctamente'); // Debug log
      
      const result = await queueEmail({
        to: recipients,
        subject: "Reporte diario de incidencias",
        html: report,
        scheduledFor: new Date()
      });

      console.log('Resultado del encolado:', result); // Debug log

      setSuccess(true);
      setMessage('Email añadido a la cola de envío correctamente');
    } catch (error: any) {
      console.error('Error detallado:', error); // Debug log
      setError(error.message);
      setSuccess(false);
      setMessage('Error al encolar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSendReport} 
      disabled={loading}
    >
      {loading ? 'Enviando...' : 'Enviar Reporte'}
    </Button>
  );
};

export default SendEmailButton;
