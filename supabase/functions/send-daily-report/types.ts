
export interface IssueImage {
  image_url: string;
}

export interface Issue {
  id: number;
  message: string;
  security_improvement?: string;
  status: string;
  area?: string;
  responsable?: string;
  issue_images?: IssueImage[];
  timestamp: string;
}

export interface ReportRow {
  id: number;
  message: string;
  timestamp: string;
  status: string;
  area: string;
  responsable: string;
  actionPlan: string;
  securityImprovement: string;
  imageUrl: string | null;
  assignedEmail: string | null;
}

export interface IssuesByStatus {
  [key: string]: ReportRow[];
}

export interface IssueReport {
  date: string;
  issues: IssuesByStatus;
  totalCount: number;
}

export interface SendDailyReportRequest {
  manual?: boolean;
  filteredByUser?: boolean;
  requestId?: string;
}

export interface SendDailyReportResponse {
  success: boolean;
  message: string;
  timestamp: string;
  requestId?: string;
  recipients?: string[];
  stats?: {
    totalEmails: number;
    successCount: number;
    failureCount: number;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface KPIData {
  total: number;
  activeIssues: ReportRow[];
  withImages: number;
}

export interface DistributionData {
  byStatus: Record<string, number>;
  byArea: Record<string, number>;
}
