
import { Issue } from "@/types/issue";

/**
 * Returns the appropriate CSS classes for an issue card based on its status
 */
export const getStatusColor = (status: Issue['status']) => {
  switch (status) {
    case 'en-estudio':
      return 'border-yellow-500 bg-yellow-50';
    case 'en-curso':
      return 'border-blue-500 bg-blue-50';
    case 'cerrada':
      return 'border-green-500 bg-green-50';
    case 'denegado':
      return 'border-red-500 bg-red-50';
    default:
      return '';
  }
};
