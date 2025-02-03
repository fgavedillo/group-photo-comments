import { format, startOfWeek, addDays, startOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

export const getGroupedDates = (filteredMessages: any[], groupBy: 'day' | 'week' | 'month') => {
  if (!filteredMessages.length) return [];

  const today = new Date();
  const startDate = startOfWeek(today, { locale: es });

  if (groupBy === 'day') {
    return [...Array(7)].map((_, index) => {
      const date = addDays(startDate, index);
      const dayMessages = filteredMessages.filter(message => {
        if (!message?.timestamp) return false;
        const messageDate = new Date(message.timestamp);
        return format(messageDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });

      return {
        date,
        dayName: format(date, 'EEEE', { locale: es }),
        dayNumber: format(date, 'd'),
        messages: dayMessages
      };
    });
  } else if (groupBy === 'week') {
    const weeks = new Map();

    filteredMessages.forEach(message => {
      if (!message?.timestamp) return;
      const messageDate = new Date(message.timestamp);
      const weekStart = startOfWeek(messageDate, { locale: es });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          date: weekStart,
          dayName: `Semana del ${format(weekStart, 'd MMMM', { locale: es })}`,
          dayNumber: format(weekStart, 'w'),
          messages: []
        });
      }
      weeks.get(weekKey).messages.push(message);
    });

    return Array.from(weeks.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } else {
    const months = new Map();

    filteredMessages.forEach(message => {
      if (!message?.timestamp) return;
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

    return Array.from(months.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
};