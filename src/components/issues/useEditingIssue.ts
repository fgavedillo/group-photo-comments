
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useIssueContext } from "./IssueContext";

export const useEditingIssue = (messages: any[]) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { setEditingIssueId } = useIssueContext();

  useEffect(() => {
    const issueId = searchParams.get('issue_id');
    const action = searchParams.get('action');
    
    if (issueId && action === 'edit') {
      const issue = messages.find(msg => msg.id === parseInt(issueId));
      if (issue) {
        console.log('Opening edit modal for issue:', issue);
        setEditingIssueId(parseInt(issueId));
        toast({
          title: "Incidencia cargada",
          description: "Se ha abierto el editor para la incidencia seleccionada",
        });
      } else {
        toast({
          title: "Error",
          description: "No se encontró la incidencia especificada",
          variant: "destructive"
        });
      }
    }
  }, [searchParams, messages, toast, setEditingIssueId]);
};
