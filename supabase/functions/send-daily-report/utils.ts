
import { Issue, ReportRow, IssuesByStatus, KPIData, DistributionData } from "./types.ts";

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'en-curso': '#FFA500',
    'en-estudio': '#808080',
    'cerrada': '#4CAF50',
  };
  return statusColors[status] || '#FF0000';
};

export const formatDate = (date = new Date()): string => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const calculateKPIs = (issues: Issue[]): KPIData => {
  const total = issues.length;
  const activeIssues = issues.filter(i => ['en-estudio', 'en-curso'].includes(i.status));
  const withImages = issues.filter(i => i.issue_images?.length > 0).length;

  return { total, activeIssues, withImages };
};

export const getDistributionData = (issues: Issue[]): DistributionData => {
  const byStatus = issues.reduce((acc: Record<string, number>, issue) => {
    const status = issue.status || 'Sin estado';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const byArea = issues.reduce((acc: Record<string, number>, issue) => {
    const area = issue.area || 'Sin área';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  return { byStatus, byArea };
};

export function groupIssuesByStatus(issues: ReportRow[]): IssuesByStatus {
  return issues.reduce((acc: IssuesByStatus, issue) => {
    const status = issue.status || 'unknown';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(issue);
    return acc;
  }, {});
}
