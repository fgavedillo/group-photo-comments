import { format, startOfWeek, addDays, startOfMonth, isWithinInterval, startOfDay, endOfDay, endOfWeek, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export const getGroupedDates = (filteredMessages: any[], groupBy: 'day' | 'week' | 'month') => {
  if (!filteredMessages || !Array.isArray(filteredMessages) || filteredMessages.length === 0) {
    console.log('No messages to group');
    return [];
  }

  const today = new Date();
  console.log('Grouping messages by:', groupBy);
  console.log('Number of messages:', filteredMessages.length);

  if (groupBy === 'day') {
    // Agrupar por días individuales
    const days = new Map();

    filteredMessages.forEach(message => {
      if (!message?.timestamp) return;
      const messageDate = new Date(message.timestamp);
      const dayStart = startOfDay(messageDate);
      const dayKey = format(dayStart, 'yyyy-MM-dd');

      if (!days.has(dayKey)) {
        days.set(dayKey, {
          date: dayStart,
          dayName: format(dayStart, 'EEEE', { locale: es }),
          dayNumber: format(dayStart, 'd MMMM yyyy', { locale: es }),
          messages: []
        });
      }
      days.get(dayKey).messages.push(message);
    });

    return Array.from(days.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } else if (groupBy === 'week') {
    // Agrupar por semanas
    const weeks = new Map();

    filteredMessages.forEach(message => {
      if (!message?.timestamp) return;
      const messageDate = new Date(message.timestamp);
      const weekStart = startOfWeek(messageDate, { locale: es });
      const weekKey = format(weekStart, 'yyyy-ww');

      if (!weeks.has(weekKey)) {
        const weekEnd = endOfWeek(weekStart, { locale: es });
        weeks.set(weekKey, {
          date: weekStart,
          dayName: `Semana del ${format(weekStart, 'd', { locale: es })} al ${format(weekEnd, 'd MMMM yyyy', { locale: es })}`,
          dayNumber: format(weekStart, 'w', { locale: es }),
          messages: []
        });
      }
      weeks.get(weekKey).messages.push(message);
    });

    return Array.from(weeks.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } else {
    // Agrupar por meses
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
          dayNumber: format(monthStart, 'M', { locale: es }),
          messages: []
        });
      }
      months.get(monthKey).messages.push(message);
    });

    return Array.from(months.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
};