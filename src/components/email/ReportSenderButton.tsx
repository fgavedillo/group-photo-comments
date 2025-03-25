import React, { useState } from 'react';

// Conservamos la estructura del componente pero eliminamos la funcionalidad
const ReportSenderButton = ({ recipients, reportId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // Función vacía que no hace nada
  const handleSendReport = async () => {
    setMessage('Funcionalidad de envío de reportes deshabilitada temporalmente');
    setSuccess(true);
  };

  return (
    <div>
      <button
        onClick={handleSendReport}
        disabled={loading}
        className="px-4 py-2 bg-gray-400 text-white rounded-md"
      >
        Enviar Reporte (Deshabilitado)
      </button>

      {error && (
        <div className="mt-2 text-red-600">
          {error}
        </div>
      )}

      {success && message && (
        <div className="mt-2 text-blue-600">
          {message}
        </div>
      )}
    </div>
  );
};

export default ReportSenderButton; 