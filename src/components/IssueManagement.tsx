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
  } = useIssueActions(loadIssues);

  const {
    areaFilter,
    responsableFilter,
    setAreaFilter,
    setResponsableFilter,
    filterIssues
  } = useIssueFilters();

  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const filteredMessages = filterIssues(messages);
  
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
      <div className="p-4 flex justify-between items-center">
        <IssueFilters
          areaFilter={areaFilter}
          responsableFilter={responsableFilter}
          onAreaFilterChange={setAreaFilter}
          onResponsableFilterChange={setResponsableFilter}
        />
        <Select value={groupBy} onValueChange={(value: 'day' | 'week' | 'month') => setGroupBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Agrupar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Por día</SelectItem>
            <SelectItem value="week">Por semana</SelectItem>
            <SelectItem value="month">Por mes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="px-4 pb-4 space-y-4">
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