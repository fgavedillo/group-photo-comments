
import { useState, useEffect, useCallback } from "react";
import { useIssueContext } from "./IssueContext";

export const useIssueFiltering = (messages: any[]) => {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [selectedStates, setSelectedStates] = useState<string[]>(['en-estudio', 'en-curso', 'cerrada', 'denegado']);
  const [responsableFilter, setResponsableFilter] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  const { isAdmin, currentUserEmail } = useIssueContext();

  // Función de filtrado mejorada
  const filterMessages = useCallback(() => {
    if (!messages || !Array.isArray(messages)) {
      console.log('No hay mensajes o formato inválido');
      setFilteredMessages([]);
      return;
    }

    try {
      console.log('Filtrando mensajes con los siguientes criterios:', {
        totalMessages: messages.length,
        selectedStates,
        responsableFilter: `"${responsableFilter}"`,
        isAdmin,
        currentUserEmail
      });

      const filtered = messages.filter(message => {
        if (!message) {
          console.log('Mensaje inválido encontrado, ignorando');
          return false;
        }
        
        // Filtro por estado
        const status = message.status || 'en-estudio';
        const statusMatch = selectedStates.includes(status);
        if (!statusMatch) {
          return false;
        }

        // Filtro por responsable
        let responsableMatch = true;
        if (responsableFilter.trim()) {
          const filterLower = responsableFilter.toLowerCase().trim();
          const responsableValue = message.responsable || '';
          const emailValue = message.assignedEmail || '';
          
          console.log('Comprobando mensaje:', {
            id: message.id,
            responsable: responsableValue,
            assignedEmail: emailValue,
            filter: filterLower,
            matchResponsable: responsableValue.toLowerCase().includes(filterLower),
            matchEmail: emailValue.toLowerCase().includes(filterLower)
          });
          
          responsableMatch = 
            responsableValue.toLowerCase().includes(filterLower) || 
            emailValue.toLowerCase().includes(filterLower);
        }
        
        // Si no es admin, solo mostrar mensajes asignados al usuario
        if (!isAdmin && currentUserEmail) {
          const userEmailLower = currentUserEmail.toLowerCase();
          const responsableLower = (message.responsable || '').toLowerCase();
          const assignedEmailLower = (message.assignedEmail || '').toLowerCase();
          
          return statusMatch && responsableMatch && (
            responsableLower === userEmailLower ||
            assignedEmailLower === userEmailLower
          );
        }
        
        return statusMatch && responsableMatch;
      });

      console.log('Resultado del filtrado:', {
        entriesFiltered: filtered.length,
        totalMessages: messages.length
      });
      
      setFilteredMessages(filtered);
    } catch (error) {
      console.error('Error filtrando mensajes:', error);
      setFilteredMessages([]);
    }
  }, [messages, selectedStates, responsableFilter, isAdmin, currentUserEmail]);

  // Aplicar filtros cuando cambian las dependencias
  useEffect(() => {
    console.log('Ejecutando efecto de filtrado', { responsableFilter });
    filterMessages();
  }, [filterMessages]);

  // Manejar cambio de estado
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

  // Manejar cambio en el filtro de responsable
  const handleResponsableFilterChange = (value: string) => {
    console.log('Estableciendo filtro de responsable a:', value);
    setResponsableFilter(value);
  };

  return {
    groupBy,
    setGroupBy,
    selectedStates,
    responsableFilter,
    setResponsableFilter: handleResponsableFilterChange,
    filteredMessages,
    handleStateToggle
  };
};
