export type Issue = {
  id: number;
  imageUrl: string;
  timestamp: Date;
  username: string;
  description: string;
  securityImprovement?: string;
  actionPlan?: string;
  status: "en-estudio" | "en-curso" | "cerrada";
  assignedEmail?: string;
  area?: string;
  responsable?: string;
}