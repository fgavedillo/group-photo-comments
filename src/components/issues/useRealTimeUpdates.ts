
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useRealTimeUpdates = (loadIssues: () => void) => {
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
          loadIssues();
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
          loadIssues();
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
