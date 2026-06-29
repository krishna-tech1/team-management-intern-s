import { apiClient } from './apiClient';

const getPrefix = () => {
  const rawSession = sessionStorage.getItem('teamlead_session');
  if (rawSession) {
    try {
      const user = JSON.parse(rawSession);
      if (user.role === 'Super Admin') return '/admin';
      if (user.role === 'Team Lead') return '/teamlead';
    } catch {}
  }
  return '/admin';
};

export interface TaskCompletionRate {
  totalTasks: number;
  completedTasks: number;
  rate: number;
}

export interface EmployeePerformanceRow {
  id: number;
  name: string;
  designation: string | null;
  department: string | null;
  totalTasks: number;
  completedTasks: number;
  efficiency: number;
}

export interface ClientGrowthRow {
  month: string;
  count: number;
}

export interface RevenueRow {
  month: string;
  revenue: number;
}

export interface AnalyticsStats {
  monthlyRevenue: RevenueRow[];
  taskCompletionRate: TaskCompletionRate;
  employeePerformance: EmployeePerformanceRow[];
  clientGrowth: ClientGrowthRow[];
}

export interface TopPerformerRow {
  id: number;
  name: string;
  employeeCode: string;
  avatar: string | null;
  department: string | null;
  designation: string | null;
  tasksClosed: number;
  efficiency: number;
}

export interface RecentActivityRow {
  id: number;
  module: string;
  action: string;
  performedBy: string;
  createdAt: string;
}

export interface MonthlySummaryRow {
  month: string;
  created: number;
  completed: number;
}

export interface DashboardStats {
  employees: number;
  activeEmployees: number;
  clients: number;
  activeClients: number;
  tasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  topPerformers: TopPerformerRow[];
  recentActivity: RecentActivityRow[];
  monthlySummary: MonthlySummaryRow[];
}

export const analyticsService = {
  getAnalyticsRows: async (): Promise<AnalyticsStats> => {
    return apiClient.get(`${getPrefix()}/analytics`);
  },
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiClient.get(`${getPrefix()}/dashboard`);
  }
};


