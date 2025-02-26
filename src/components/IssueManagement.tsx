
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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

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

  // Obtener el rol del usuario y su email
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const [roleResponse, userResponse] = await Promise.all([
          supabase.rpc('has_role', { _role: 'admin' }),
          supabase.auth.getUser()
        ]);
        
        if (roleResponse.error) throw roleResponse.error;
        setIsAdmin(!!roleResponse.data);

        if (userResponse.data?.user) {
          setCurrentUserEmail(userResponse.data.user.email);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, []);

  // Configurar suscripción a cambios en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Cambio detectado en issues:', payload);
          loadIssues();
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción a cambios en tiempo real:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadIssues]);

  // Filtrar mensajes
  useEffect(() => {
    const filterAndSetMessages = async () => {
      if (!messages || !Array.isArray(messages)) {
        console.log('No hay mensajes o formato inválido');
        setFilteredMessages([]);
        return;
      }

      try {
        console.log('Filtrando mensajes:', {
          totalMessages: messages.length,
          selectedStates,
          responsableFilter,
          isAdmin,
          currentUserEmail
        });

        const filtered = messages.filter(message => {
          if (!message) return false;
          
          const status = message.status || 'en-estudio';
          const statusMatch = selectedStates.includes(status);
          
          const responsableMatch = !responsableFilter || 
            (message.responsable && 
             message.responsable.toLowerCase().includes(responsableFilter.toLowerCase()));
          
          // Si no es admin, solo mostrar mensajes asignados al usuario
          if (!isAdmin && currentUserEmail) {
            return statusMatch && 
                   (message.responsable?.toLowerCase() === currentUserEmail.toLowerCase() ||
                    message.assignedEmail?.toLowerCase() === currentUserEmail.toLowerCase());
          }
          
          return statusMatch && responsableMatch;
        });

        console.log('Mensajes filtrados:', filtered.length);
        setFilteredMessages(filtered);
      } catch (error) {
        console.error('Error filtrando mensajes:', error);
        setFilteredMessages([]);
      }
    };

    filterAndSetMessages();
  }, [messages, selectedStates, responsableFilter, isAdmin, currentUserEmail]);

  const handleStateToggle = (state: string) => {
    console.log('Cambiando estado:', state);
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
