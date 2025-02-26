
import { useState, useEffect } from "react";
import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { WeekDayCard } from "./WeekDayCard";
import { IssueFilters } from "./IssueFilters";
import { getGroupedDates } from "@/utils/dateUtils";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const IssueManagement = ({ messages }: { messages: any[] }) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { issues, loadIssues } = useIssues();
  const {
    securityImprovements,
    actionPlans,
    handleStatusChange,
    handleAreaChange,
    handleResponsableChange,
    handleSecurityImprovementChange,
    handleActionPlanChange,
    handleAddSecurityImprovement,
    handleAssignedEmailChange
  } = useIssueActions(loadIssues);

  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [selectedStates, setSelectedStates] = useState<string[]>(['en-estudio', 'en-curso', 'cerrada', 'denegado']);
  const [responsableFilter, setResponsableFilter] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);

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
  }, [searchParams, messages]);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _role: 'admin'
        });
        
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    const filterAndSetMessages = async () => {
      if (!messages || !Array.isArray(messages)) {
        console.log('No messages or invalid messages format');
        setFilteredMessages([]);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const filtered = messages.filter(message => {
          if (!message) return false;
          
          const status = message.status || 'en-estudio';
          const statusMatch = selectedStates.includes(status);
          const responsableMatch = !responsableFilter || 
            (message.responsable && 
             message.responsable.toLowerCase().includes(responsableFilter.toLowerCase()));
          
          // If user is not admin, only show messages they're responsible for
          if (!isAdmin && message.responsable && user?.email) {
            return statusMatch && responsableMatch && message.responsable.toLowerCase() === user.email.toLowerCase();
          }
          
          return statusMatch && responsableMatch;
        });

        console.log('Filtered messages:', filtered);
        setFilteredMessages(filtered);
      } catch (error) {
        console.error('Error filtering messages:', error);
        setFilteredMessages([]);
      }
    };

    filterAndSetMessages();
  }, [messages, selectedStates, responsableFilter, isAdmin]);

  const handleStateToggle = (state: string) => {
    console.log('Toggling state:', state);
    setSelectedStates(prev => {
      if (prev.includes(state)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== state);
      }
      return [...prev, state];
    });
  };

  const groupedDates = getGroupedDates(filteredMessages, groupBy);

  return (
    <div className="h-full bg-white/50 rounded-lg shadow-sm">
      <div className="sticky top-0 z-50 bg-white border-b">
        <IssueFilters
          groupBy={groupBy}
          selectedStates={selectedStates}
          responsableFilter={responsableFilter}
          onGroupByChange={(value) => {
            console.log('Changing groupBy to:', value);
            setGroupBy(value);
          }}
          onStateToggle={handleStateToggle}
          onResponsableFilterChange={setResponsableFilter}
        />
      </div>
      
      <div className="px-4 pb-4 space-y-4 overflow-y-auto">
        {groupedDates.map((period) => (
          <WeekDayCard
            key={`${period.dayName}-${period.dayNumber}`}
            dayName={period.dayName}
            dayNumber={period.dayNumber}
            messages={period.messages}
            onStatusChange={handleStatusChange}
            onAreaChange={handleAreaChange}
            onResponsableChange={handleResponsableChange}
            onDelete={loadIssues}
            securityImprovements={securityImprovements}
            actionPlans={actionPlans}
            onSecurityImprovementChange={handleSecurityImprovementChange}
            onActionPlanChange={handleActionPlanChange}
            onAddSecurityImprovement={handleAddSecurityImprovement}
            onAssignedEmailChange={handleAssignedEmailChange}
            isAdmin={isAdmin}
            editingIssueId={editingIssueId}
          />
        ))}
      </div>
    </div>
  );
};
