
export type Issue = {
  id: number;
  imageUrl?: string; // Ahora es opcional ya que viene de la tabla issue_images
  timestamp: Date;
  username: string;
  message: string;
  securityImprovement?: string;
  actionPlan?: string;
  status: "en-estudio" | "en-curso" | "cerrada" | "denegado";
  assignedEmail?: string;
  area?: string;
  responsable?: string;
  user_id?: string;
}
