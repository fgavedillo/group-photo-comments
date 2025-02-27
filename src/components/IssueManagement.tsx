
import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { IssueContextProvider } from "./issues/IssueContext";
import { IssueFiltersSection } from "./issues/IssueFiltersSection";
import { IssueGroupedView } from "./issues/IssueGroupedView";
import { useIssueFiltering } from "./issues/useIssueFiltering";
import { useEditingIssue } from "./issues/useEditingIssue";
import { useRealTimeUpdates } from "./issues/useRealTimeUpdates";
import { useEffect } from "react";

export const IssueManagement = ({ messages }: { messages: any[] }) => {
  const { loadIssues } = useIssues();
  const issueActions = useIssueActions(loadIssues);

  return (
    <IssueContextProvider>
      <IssueManagementContent 
        messages={messages} 
        issueActions={issueActions} 
        loadIssues={loadIssues} 
      />
    </IssueContextProvider>
  );
};

const IssueManagementContent = ({ 
  messages, 
  issueActions, 
  loadIssues 
}: { 
  messages: any[]; 
  issueActions: ReturnType<typeof useIssueActions>;
  loadIssues: () => Promise<void>;
}) => {
  // Gestión de edición de incidencias desde URL
  useEditingIssue(messages);
  
  // Suscripción a cambios en tiempo real
  useRealTimeUpdates(loadIssues);

  // Funcionalidad de filtrado
  const {
    groupBy,
    setGroupBy,
    selectedStates,
    responsableFilter,
    setResponsableFilter,
    filteredMessages,
    handleStateToggle
  } = useIssueFiltering(messages);
  
  // Monitorizar el estado del filtro
  useEffect(() => {
    console.log('IssueManagement - Estado del filtro de responsable:', responsableFilter);
  }, [responsableFilter]);

  return (
    <div className="h-full bg-white/50 rounded-lg shadow-sm">
      <IssueFiltersSection
        groupBy={groupBy}
        selectedStates={selectedStates}
        responsableFilter={responsableFilter}
        onGroupByChange={setGroupBy}
        onStateToggle={handleStateToggle}
        onResponsableFilterChange={(value) => {
          console.log('IssueManagement - Cambiando filtro de responsable a:', value);
          setResponsableFilter(value);
        }}
      />
      
      <IssueGroupedView
        filteredMessages={filteredMessages}
        groupBy={groupBy}
        issueActions={issueActions}
        onReload={loadIssues}
      />
    </div>
  );
};
