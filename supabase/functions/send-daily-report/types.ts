
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

export interface KPIData {
  total: number;
  activeIssues: Issue[];
  withImages: number;
}

export interface DistributionData {
  byStatus: Record<string, number>;
  byArea: Record<string, number>;
}
