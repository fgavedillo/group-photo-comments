
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useReportSender } from "@/hooks/useReportSender";
import { FileImage, RefreshCw, Filter, AlertCircle, CheckCircle, Mail, BarChart2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReportMethodSelector } from "./ReportMethodSelector";

export const ReportSenderButton = () => {
  const { 
    sendReport, 
    isLoading, 
    error, 
    lastResponse, 
    useResend, 
    toggleSendMethod 
  } = useReportSender();
  
  const [filtered, setFiltered] = useState(false);
  
  const handleSendReport = async () => {
    try {
      console.log(`Sending ${filtered ? 'personalized' : 'complete'} report with ${useResend ? 'Resend' : 'EmailJS'}...`);
      await sendReport(filtered);
    } catch (err) {
      // Error is already handled in the hook
      console.error("Error handled in button:", err);
    }
  };
  
  const toggleFilter = () => {
    setFiltered(!filtered);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendReport}
          disabled={isLoading}
          className={filtered ? "border-green-600 text-green-700" : ""}
          title={filtered ? "Send to each person only their assigned incidents" : "Send all incidents to all configured contacts"}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              {useResend ? (
                <BarChart2 className="mr-2 h-4 w-4" />
              ) : (
                <FileImage className="mr-2 h-4 w-4" />
              )}
              {filtered 
                ? "Send Dashboard Report to Individual Recipients" 
                : "Send Dashboard Report to All Recipients"}
            </>
          )}
        </Button>
        
        <Button
          variant="ghost" 
          size="sm"
          onClick={toggleFilter}
          className="text-xs"
          title={filtered ? "Change to global sending mode" : "Change to personalized sending mode"}
        >
          <Filter className={`h-4 w-4 mr-2 ${filtered ? 'text-green-600' : ''}`} />
          {filtered ? "Global Mode" : "Individual Mode"}
        </Button>
        
        <ReportMethodSelector
          useResend={useResend}
          toggleSendMethod={toggleSendMethod}
        />
        
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <span>Using: {useResend ? 'Resend' : 'EmailJS'}</span>
        </div>
      </div>
      
      {error ? (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Send error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : lastResponse?.success ? (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Successful send</AlertTitle>
          <AlertDescription>
            Dashboard report successfully sent with {useResend ? 'Resend' : 'EmailJS'}.
            {lastResponse.data?.stats && (
              <div className="text-xs mt-1 text-gray-500">
                {lastResponse.data.stats.successCount || 0} successful sends, {lastResponse.data.stats.failureCount || 0} failed.
                {lastResponse.data.stats.issueCount !== undefined && (
                  <span> Included {lastResponse.data.stats.issueCount} issues.</span>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};
