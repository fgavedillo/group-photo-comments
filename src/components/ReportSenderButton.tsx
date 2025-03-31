
import { useState } from 'react';
import { Button } from "@/components/ui/button";

export function ReportSenderButton({ recipients, reportData }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified version - all email functionality removed
  const handleSendReport = async () => {
    console.log("Email functionality has been removed");
    // You would implement your new email sending solution here
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
