
import { useState, useEffect } from "react";
import { useIssueContext } from "./IssueContext";

export const useIssueFiltering = (messages: any[]) => {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [selectedStates, setSelectedStates] = useState<string[]>(['en-estudio', 'en-curso', 'cerrada', 'denegado']);
  const [responsableFilter, setResponsableFilter] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  const { isAdmin, currentUserEmail } = useIssueContext();

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

  return {
    groupBy,
    setGroupBy,
    selectedStates,
    responsableFilter,
    setResponsableFilter,
    filteredMessages,
    handleStateToggle
  };
};
