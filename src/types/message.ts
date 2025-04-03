
export interface Message {
  id: string;
  username: string;
  timestamp: Date;
  message: string;
  imageUrl?: string;
  status?: string;
  area?: string;
  responsable?: string;
  securityImprovement?: string;
  actionPlan?: string;
  assignedEmail?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
}
