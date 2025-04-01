/**
 * Interfaz que define la estructura de un mensaje/incidencia en la aplicación
 * Contiene todos los campos relacionados con mensajes que se muestran en la UI
 */
export interface Message {
  /** Identificador único del mensaje */
  id: string;
  
  /** Nombre del usuario que creó el mensaje */
  username: string;
  
  /** Fecha y hora de creación del mensaje */
  timestamp: Date;
  
  /** Contenido del mensaje */
  message: string;
  
  /** URL de la imagen asociada (opcional) */
  imageUrl?: string;
  
  /** Estado actual de la incidencia (en-estudio, en-curso, etc.) */
  status?: string;
  
  /** Área o departamento relacionado con la incidencia */
  area?: string;
  
  /** Persona responsable de resolver la incidencia */
  responsable?: string;
  
  /** Mejora de seguridad propuesta */
  securityImprovement?: string;
  
  /** Plan de acción para resolver la incidencia */
  actionPlan?: string;
  
  /** Correo electrónico de la persona asignada */
  assignedEmail?: string;
  
  /** ID del usuario que creó el mensaje */
  userId?: string;
  
  /** Nombre del usuario */
  firstName?: string;
  
  /** Apellido del usuario */
  lastName?: string;
}
