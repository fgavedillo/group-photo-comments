
import { useState } from "react";
import { useReportGeneration } from "@/hooks/useReportGeneration";
import { checkEmailJSConnection } from "@/utils/emailUtils";
import { EmailStatusAlerts } from "../email/EmailStatusAlerts";
import { ReportGenerateButton } from "./ReportGenerateButton";
import { ReportMethodSelector } from "./ReportMethodSelector";

interface ReportButtonProps {
  dashboardRef: React.RefObject<HTMLDivElement>;
  issuesTableRef?: React.RefObject<HTMLDivElement>;
}

export const ReportButton = ({ dashboardRef, issuesTableRef }: ReportButtonProps) => {
  const {
    isGenerating,
    isLoading,
    lastSendStatus,
    detailedError,
    retryCount,
    connectionStatus,
    alternativeMethod,
    setConnectionStatus,
    retryGenerateReport,
    toggleSendMethod,
    handleGenerateReport
  } = useReportGeneration();

  // Check connection with EmailJS
  const handleCheckConnection = async () => {
    return await checkEmailJSConnection(setConnectionStatus);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <ReportGenerateButton 
          isGenerating={isGenerating}
          isLoading={isLoading}
          handleGenerateReport={handleGenerateReport}
          alternativeMethod={alternativeMethod}
        />
        
        <ReportMethodSelector 
          alternativeMethod={alternativeMethod}
          toggleSendMethod={toggleSendMethod}
        />
      </div>
      
      {(lastSendStatus || detailedError || connectionStatus) && (
        <div className="mt-2">
          <EmailStatusAlerts
            lastSendStatus={lastSendStatus}
            detailedError={detailedError}
            retryCount={retryCount}
            connectionStatus={connectionStatus}
            onRetry={retryGenerateReport}
            onCheckConnection={handleCheckConnection}
          />
        </div>
      )}
    </div>
  );
};
