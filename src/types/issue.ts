export type Issue = {
  id: number;
  imageUrl: string;
  timestamp: Date;
  username: string;
  message: string;
  securityImprovement?: string;
  actionPlan?: string;
  status: "en-estudio" | "en-curso" | "cerrada" | "denegado";
  assignedEmail?: string;
  area?: string;
  responsable?: string;
}