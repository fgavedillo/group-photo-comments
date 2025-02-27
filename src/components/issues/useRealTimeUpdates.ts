
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export const useRealTimeUpdates = (loadIssues: () => void) => {
  // Ref para rastrear si estamos en medio de una actualización
  const isUpdatingRef = useRef(false);
  // Ref para rastrear si hay actualizaciones pendientes
  const pendingUpdateRef = useRef(false);

  // Función para manejar actualizaciones con debounce
  const handleUpdate = () => {
    if (isUpdatingRef.current) {
      // Si estamos actualizando, marcar que hay una actualización pendiente
      pendingUpdateRef.current = true;
      return;
    }

    // Marcar que estamos actualizando
    isUpdatingRef.current = true;
    
    // Cargar las incidencias
    loadIssues();
    
    // Después de un tiempo, permitir nuevas actualizaciones
    setTimeout(() => {
      isUpdatingRef.current = false;
      
      // Si hay actualizaciones pendientes, procesarlas
      if (pendingUpdateRef.current) {
        pendingUpdateRef.current = false;
        handleUpdate();
      }
    }, 300);
  };

  // Configurar suscripción a cambios en tiempo real
  useEffect(() => {
    // Carga inicial de issues
    loadIssues();
    
    // Canal principal para escuchar cambios en la tabla issues
    const issuesChannel = supabase
      .channel('issues-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Cambio detectado en issues:', payload);
          handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción a issues:', status);
      });
      
    // Canal adicional para escuchar cambios en la tabla issue_images
    const imagesChannel = supabase
      .channel('issue-images-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issue_images'
        },
        (payload) => {
          console.log('Cambio detectado en issue_images:', payload);
          handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción a issue_images:', status);
      });

    // Limpieza de suscripciones al desmontar
    return () => {
      supabase.removeChannel(issuesChannel);
      supabase.removeChannel(imagesChannel);
    };
  }, [loadIssues]);
};
