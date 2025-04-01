
/**
 * Hook personalizado para gestionar la carga y actualización de incidencias
 * Proporciona acceso a las incidencias desde la base de datos y suscripción a actualizaciones en tiempo real
 */
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Issue } from "@/types/issue";
import { realtimeManager } from "@/lib/realtimeManager";

/**
 * Hook que proporciona acceso a las incidencias y funcionalidad para gestionarlas
 * @returns Objeto con las incidencias y función para recargarlas
 */
export const useIssues = () => {
  // Estado para almacenar las incidencias
  const [issues, setIssues] = useState<Issue[]>([]);
  const { toast } = useToast();

  /**
   * Formatea un nombre completo a partir de nombre y apellido
   * @param firstName - Nombre del usuario
   * @param lastName - Apellido del usuario
   * @returns Nombre formateado o "Sin asignar" si no hay datos
   */
  const formatUserName = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "Sin asignar";
    return `${firstName || ''} ${lastName || ''}`.trim();
  };

  /**
   * Carga las incidencias desde la base de datos y las formatea para su uso en la aplicación
   */
  const loadIssues = useCallback(async () => {
    try {
      // Verificar que el usuario esté autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, user must be authenticated');
        return;
      }

      console.log('Fetching issues from issue_details view...');
      // Consulta a la vista issue_details que combina datos de varias tablas
      const { data: issuesData, error: issuesError } = await supabase
        .from('issue_details')
        .select('*')
        .order('timestamp', { ascending: false });

      if (issuesError) {
        console.error('Error fetching issues:', issuesError);
        throw issuesError;
      }

      if (!issuesData) {
        console.log('No issues data returned');
        return;
      }

      console.log('Fetched issues:', issuesData.length);

      // Transformar los datos de la base de datos al formato de Issue
      const formattedIssues: Issue[] = issuesData.map(issue => ({
        id: issue.id,
        imageUrl: issue.image_url || '',
        timestamp: new Date(issue.timestamp || ''),
        username: formatUserName(issue.first_name, issue.last_name),
        message: issue.message,
        securityImprovement: issue.security_improvement || undefined,
        actionPlan: issue.action_plan || undefined,
        status: (issue.status as Issue['status']) || 'en-estudio',
        assignedEmail: issue.assigned_email || undefined,
        area: issue.area || undefined,
        responsable: issue.responsable || undefined,
        user_id: issue.user_id
      }));

      // Actualizar el estado con las incidencias formateadas
      setIssues(formattedIssues);
    } catch (error) {
      console.error('Error loading issues:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las incidencias",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    // Cargar incidencias inicialmente
    loadIssues();

    // Suscribirse a cambios en tiempo real usando el gestor centralizado
    const cleanupIssues = realtimeManager.subscribe(
      'issues-changes',
      { event: '*', table: 'issues' },
      (payload) => {
        console.log('Received realtime update for issues:', payload);
        loadIssues();
      }
    );
    
    const cleanupImages = realtimeManager.subscribe(
      'issues-changes',
      { event: '*', table: 'issue_images' },
      (payload) => {
        console.log('Received realtime update for issue_images:', payload);
        loadIssues();
      }
    );

    // Limpiar suscripciones cuando el componente se desmonte
    return () => {
      cleanupIssues();
      cleanupImages();
    };
  }, [loadIssues]);

  return { issues, loadIssues };
};
