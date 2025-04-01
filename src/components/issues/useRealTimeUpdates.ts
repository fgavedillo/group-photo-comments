
import { useEffect } from "react";
import { realtimeManager } from "@/lib/realtimeManager";

/**
 * Hook para suscribirse a actualizaciones en tiempo real de las incidencias
 * Utiliza un gestor centralizado para evitar duplicación de suscripciones
 * 
 * @param loadIssues Función para recargar las incidencias
 */
export const useRealTimeUpdates = (loadIssues: () => void) => {
  // Configurar suscripción a cambios en tiempo real
  useEffect(() => {
    // Variable para controlar si hay una actualización en curso
    let isUpdating = false;
    // Variable para rastrear si hay actualizaciones pendientes
    let pendingUpdate = false;
    // Timestamp del último update
    let lastUpdate = Date.now();

    // Función para manejar actualizaciones con debounce
    const handleUpdate = () => {
      const now = Date.now();
      
      // Evitar actualizaciones demasiado frecuentes (al menos 300ms entre cada una)
      if (now - lastUpdate < 300) {
        // Si estamos actualizando muy rápido, marcar que hay una actualización pendiente
        pendingUpdate = true;
        return;
      }

      if (isUpdating) {
        // Si estamos actualizando, marcar que hay una actualización pendiente
        pendingUpdate = true;
        return;
      }

      // Actualizar timestamp y marcar que estamos actualizando
      lastUpdate = now;
      isUpdating = true;
      
      // Usar requestAnimationFrame para asegurar que la UI esté lista
      requestAnimationFrame(() => {
        // Cargar las incidencias
        loadIssues();
        
        // Después de un tiempo, permitir nuevas actualizaciones
        setTimeout(() => {
          isUpdating = false;
          
          // Si hay actualizaciones pendientes, procesarlas
          if (pendingUpdate) {
            pendingUpdate = false;
            handleUpdate();
          }
        }, 300);
      });
    };

    // Suscribirse a cambios en tiempo real usando el gestor centralizado
    const cleanupIssues = realtimeManager.subscribe(
      'realtime-updates',
      { event: '*', table: 'issues' },
      () => handleUpdate()
    );
    
    const cleanupImages = realtimeManager.subscribe(
      'realtime-updates',
      { event: '*', table: 'issue_images' },
      () => handleUpdate()
    );

    // Limpieza de suscripciones al desmontar
    return () => {
      cleanupIssues();
      cleanupImages();
    };
  }, [loadIssues]);
};
