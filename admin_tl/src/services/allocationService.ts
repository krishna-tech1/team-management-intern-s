import { apiClient } from './apiClient';

export interface Allocation {
  id: number;
  clientId: number;
  employeeId: number;
  allocatedBy: string;
  allocatedAt: string;
  client: {
    id: number;
    companyName: string;
    contactPerson: string;
    email: string;
  };
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department: string | null;
  };
}

export const allocationService = {
  getAllAllocations: async (page = 1, limit = 1000): Promise<Allocation[]> => {
    return apiClient.get(`/admin/allocations?page=${page}&limit=${limit}`);
  },
  
  allocateClient: async (clientId: number, employeeId: number): Promise<Allocation> => {
    return apiClient.post('/admin/allocate-client', { clientId, employeeId });
  },
  
  updateAllocation: async (id: number, clientId: number, employeeId: number): Promise<Allocation> => {
    return apiClient.put(`/admin/allocations/${id}`, { clientId, employeeId });
  }
};
