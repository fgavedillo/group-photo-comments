/**
 * Tipo que define la estructura de una incidencia en la aplicación
 * Representa un problema o situación reportada por un usuario
 */
export type Issue = {
  /** Identificador único de la incidencia */
  id: number;
  
  /** URL de la imagen asociada a la incidencia (opcional) */
  imageUrl?: string;
  
  /** Fecha y hora de creación de la incidencia */
  timestamp: Date;
  
  /** Nombre del usuario que creó la incidencia */
  username: string;
  
  /** Descripción del problema o situación */
  message: string;
  
  /** Mejora de seguridad propuesta para resolver la incidencia */
  securityImprovement?: string;
  
  /** Plan de acción para resolver la incidencia */
  actionPlan?: string;
  
  /** Estado actual de la incidencia */
  status: "en-estudio" | "en-curso" | "cerrada" | "denegado";
  
  /** 
   * Correo electrónico de la persona asignada a la incidencia.
   * Se utiliza para:
   * - Notificaciones sobre cambios en la incidencia
   * - Envío de reportes y actualizaciones
   * - Seguimiento de la resolución
   */
  assignedEmail?: string;
  
  /** Área o departamento relacionado con la incidencia */
  area?: string;
  
  /** Persona responsable de resolver la incidencia */
  responsable?: string;
  
  /** ID del usuario que creó la incidencia */
  user_id?: string;
}
