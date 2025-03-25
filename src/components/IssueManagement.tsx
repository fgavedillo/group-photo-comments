import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { IssueContextProvider } from "./issues/IssueContext";
import { IssueFiltersSection } from "./issues/IssueFiltersSection";
import { IssueGroupedView } from "./issues/IssueGroupedView";
import { useIssueFiltering } from "./issues/useIssueFiltering";
import { useEditingIssue } from "./issues/useEditingIssue";
import { useRealTimeUpdates } from "./issues/useRealTimeUpdates";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex-1">
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
        </div>
        
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar sin responsable
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar incidencias sin responsable?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente todas las incidencias que no tienen un responsable asignado.
                  Esta operación no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => issueActions.deleteIssuesWithoutResponsable()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="p-2">
        <IssueGroupedView
          filteredMessages={filteredMessages}
          groupBy={groupBy}
          issueActions={issueActions}
          onReload={loadIssues}
        />
      </div>
    </div>
  );
};
