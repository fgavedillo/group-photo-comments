import { useState } from "react";
import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { useIssueFilters } from "@/hooks/useIssueFilters";
import { IssueFilters } from "./IssueFilters";
import { WeekDayCard } from "./WeekDayCard";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameWeek, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const IssueManagement = ({ messages }: { messages: any[] }) => {
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
  } = useIssueActions(() => {
    loadIssues();
    // Forzar la actualización de los filtros al recargar las incidencias
    const currentMessages = filterIssues(messages);
    setFilteredMessages(currentMessages);
  });

  const {
    areaFilter,
    responsableFilter,
    setAreaFilter,
    setResponsableFilter,
    filterIssues
  } = useIssueFilters();

  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredMessages, setFilteredMessages] = useState(messages);
  
  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    const filtered = filterIssues(messages).filter(message => 
      status === 'all' || message.status === status
    );
    setFilteredMessages(filtered);
  };
  
  const getGroupedDates = () => {
    const startDate = startOfWeek(new Date(), { locale: es });
    
    if (groupBy === 'day') {
      return [...Array(7)].map((_, index) => {
        const date = addDays(startDate, index);
        return {
          date,
          dayName: format(date, 'EEEE', { locale: es }),
          dayNumber: format(date, 'd'),
          messages: filteredMessages.filter(message => 
            format(new Date(message.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          )
        };
      });
    } else if (groupBy === 'week') {
      const weeks = new Map();
      filteredMessages.forEach(message => {
        const messageDate = new Date(message.timestamp);
        const weekStart = startOfWeek(messageDate, { locale: es });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        
        if (!weeks.has(weekKey)) {
          weeks.set(weekKey, {
            date: weekStart,
            dayName: `Semana del ${format(weekStart, 'd', { locale: es })}`,
            dayNumber: format(weekStart, 'w'),
            messages: []
          });
        }
        weeks.get(weekKey).messages.push(message);
      });
      return Array.from(weeks.values());
    } else {
      const months = new Map();
      filteredMessages.forEach(message => {
        const messageDate = new Date(message.timestamp);
        const monthStart = startOfMonth(messageDate);
        const monthKey = format(monthStart, 'yyyy-MM');
        
        if (!months.has(monthKey)) {
          months.set(monthKey, {
            date: monthStart,
            dayName: format(monthStart, 'MMMM yyyy', { locale: es }),
            dayNumber: format(monthStart, 'M'),
            messages: []
          });
        }
        months.get(monthKey).messages.push(message);
      });
      return Array.from(months.values());
    }
  };

  const groupedDates = getGroupedDates();

  return (
    <div className="h-full bg-white/50 rounded-lg shadow-sm">
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="flex justify-between items-center gap-4 p-4">
          <Select value={groupBy} onValueChange={(value: 'day' | 'week' | 'month') => setGroupBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="day">Por día</SelectItem>
              <SelectItem value="week">Por semana</SelectItem>
              <SelectItem value="month">Por mes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="en-estudio">En estudio</SelectItem>
              <SelectItem value="en-curso">En curso</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
              <SelectItem value="denegado">Denegado</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          />
        ))}
      </div>
    </div>
  );
};