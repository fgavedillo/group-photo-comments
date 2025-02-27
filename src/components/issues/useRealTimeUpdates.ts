
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useRealTimeUpdates = (loadIssues: () => void) => {
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
};
