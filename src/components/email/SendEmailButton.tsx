import { queueEmail } from '../../services/emailQueueService';

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
  } catch (error) {
    console.error('Error detallado:', error); // Debug log
    setError(error.message);
    setSuccess(false);
    setMessage('Error al encolar el email');
  } finally {
    setLoading(false);
  }
}; 