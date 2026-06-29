import { apiClient } from './apiClient';

export interface AuditLog {
  id: number;
  action: string;
  performedBy: string;
  module: string;
  entity: string;
  entityId: number | null;
  createdAt: string;
}

export const auditLogService = {
  getAuditLogs: async (page = 1, limit = 1000): Promise<AuditLog[]> => {
    return apiClient.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
  }
};
