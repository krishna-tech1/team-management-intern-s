import { apiClient } from './apiClient';

export interface DocumentRecord {
  id: number;
  fileName: string;
  filePath: string;
  fileUrl: string | null;
  documentType: 'GST' | 'MCA' | 'OTHER';
  clientId: number | null;
  employeeId: number | null;
  uploadedBy: string | null;
  createdAt: string;
  client?: {
    id: number;
    companyName: string;
  } | null;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

export const documentService = {
  getDocuments: async (
    page = 1,
    limit = 100,
    clientId?: number,
    employeeId?: number
  ): Promise<DocumentRecord[]> => {
    let url = `/admin/documents?page=${page}&limit=${limit}`;
    if (clientId) url += `&clientId=${clientId}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    return apiClient.get(url);
  },

  uploadFile: async (
    file: File,
    type = 'employees/documents'
  ): Promise<{ secure_url: string; public_id: string; fileName: string; fileType: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/upload?type=${type}`, formData);
  },

  createDocumentRecord: async (data: {
    fileName: string;
    fileUrl: string;
    clientId?: number;
    employeeId?: number;
  }): Promise<DocumentRecord> => {
    return apiClient.post('/admin/documents', data);
  },

  deleteDocument: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete(`/admin/documents/${id}`);
  }
};
