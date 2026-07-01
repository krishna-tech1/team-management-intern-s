import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadCsv } from '@/lib/utils'
import { type Employee } from '@/data/employees'
import { type Client } from '@/data/clients'
import { employeeService } from '@/services/employeeService'
import { clientService } from '@/services/clientService'
import { documentService } from '@/services/documentService'
import Spinner from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { toast } from '@/components/ui/Toast'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { taskService } from '@/services/taskService'

interface AttentionRow {
  id: string
  employee: string
  role: string
  initials: string
  status: string
  statusType: 'danger' | 'info'
  lastAction: string
  performance: number
  actionLabel: string
}

export default function LeadDashboard() {
  const navigate = useNavigate()
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [tasksList, setTasksList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [taskName, setTaskName] = useState('')
  const [taskPriority, setTaskPriority] = useState('Standard')

  const [docsList, setDocsList] = useState<any[]>([])

  // Centralised data fetch — called on mount and after any mutation
  const fetchDashboardData = useCallback(async () => {
    try {
      const [emps, clis, tasks, docsData] = await Promise.all([
        employeeService.getEmployees(),
        clientService.getClients(),
        taskService.getTasks(),
        documentService.getDocuments(1, 100).catch(err => {
          console.warn('Failed to load documents:', err);
          return [];
        })
      ])
      setEmployeesList(emps)
      setClientsList(clis)
      setTasksList(tasks)
      setDocsList(docsData || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleVerifyProgressDoc = async (docId: number) => {
    try {
      await documentService.verifyDocument(docId);
      toast({ message: 'Document progress verified successfully!', type: 'success' });
      fetchDashboardData();
    } catch (err: any) {
      toast({ message: err.message || 'Failed to verify document', type: 'error' });
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Re-fetch when other pages signal a data change
  useEffect(() => {
    function onTasksChanged() { fetchDashboardData() }
    function onEmployeesChanged() { fetchDashboardData() }
    window.addEventListener('tasks:changed', onTasksChanged)
    window.addEventListener('employees:changed', onEmployeesChanged)
    return () => {
      window.removeEventListener('tasks:changed', onTasksChanged)
      window.removeEventListener('employees:changed', onEmployeesChanged)
    }
  }, [fetchDashboardData])

  // Derive attention required list from actual employees
  const attentionRequiredData = useMemo<AttentionRow[]>(() => {
    return employeesList
      .filter(emp => emp.assignedTasks === 0 || emp.status === 'Inactive')
      .map(emp => {
        const initials = emp.name.split(' ').map(n => n[0]).join('').toUpperCase()
        return {
          id: emp.id,
          employee: emp.name,
          role: emp.designation,
          initials: initials.slice(0, 2),
          status: emp.status === 'Inactive' ? 'Inactive Profile' : 'No Task Assigned',
          statusType: emp.status === 'Inactive' ? 'info' : 'danger',
          lastAction: 'Check profile',
          performance: emp.score,
          actionLabel: emp.status === 'Inactive' ? 'Activate' : 'Assign Now',
        }
      })
  }, [employeesList])

  // Derive leaderboard from top performing active employees
  const leaderboardData = useMemo(() => {
    return employeesList
      .filter(emp => emp.status === 'Active')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((emp, index) => ({
        rank: index + 1,
        name: emp.name,
        amount: (emp.incentiveEarned && emp.incentiveEarned > 0)
          ? `₹${emp.incentiveEarned.toLocaleString()}`
          : 'Pending sync',
        progress: emp.score,
      }))
  }, [employeesList])

  const inactiveStaffCount = useMemo(() => employeesList.filter(e => e.status !== 'Active').length, [employeesList])

  const activeStaffCount = useMemo(() => {
    return employeesList.filter(e => e.status === 'Active').length
  }, [employeesList])

  const assignedTasksCount = useMemo(() => tasksList.filter((t: any) => t.employee).length, [tasksList])
  const unassignedTasksCount = useMemo(() => tasksList.filter((t: any) => !t.employee).length, [tasksList])

  const handleExport = () => {
    const totalIncentives = employeesList.reduce((sum, e) => sum + (e.incentiveEarned || 0), 0)
    const averagePerformance = employeesList.length > 0 
      ? Math.round(employeesList.reduce((sum, e) => sum + e.score, 0) / employeesList.length)
      : 0

    const sortedEmployees = [...employeesList].sort((a, b) => b.score - a.score)

    const rows = sortedEmployees.map((emp, index) => {
      const attentionRow = attentionRequiredData.find(a => a.id === emp.id)
      return {
        'Rank (Performance)': index + 1,
        'Employee Name': emp.name,
        'Designation': emp.designation,
        'Status': emp.status,
        'Performance Score (%)': `${emp.score}%`,
        'Assigned Tasks': emp.assignedTasks,
        'Incentives Earned (INR)': `₹${(emp.incentiveEarned || 0).toLocaleString()}`,
        'Table': attentionRow ? attentionRow.status : 'None',
        'Total Team Incentives Forecast': index === 0 ? `₹${totalIncentives.toLocaleString()}` : '',
        'Total Tasks Assigned': index === 0 ? assignedTasksCount : '',
        'Total Tasks Unassigned': index === 0 ? unassignedTasksCount : '',
        'Active Staff Count': index === 0 ? activeStaffCount : '',
        'Average Performance Score': index === 0 ? `${averagePerformance}%` : '',
      }
    })

    downloadCsv(rows, 'team_dashboard_analytics_report.csv')
  }

  const handleAction = (actionLabel: string, employeeId: string) => {
    if (actionLabel === 'Assign Now') {
      setSelectedEmp(employeeId)
      setShowAssignModal(true)
    } else {
      const emp = employeesList.find(e => e.id === employeeId)
      toast({
        message: emp ? `Reviewing ${emp.name}'s profile and next steps.` : 'Reviewing employee profile.',
        type: 'info',
      })
    }
  }

  return (
    <div className="overview-page">
      <div className="overview-header-row">
        <div>
          <h2 className="overview-page-title">Team Overview</h2>
          <p className="overview-page-subtitle">Real-time performance and operational status of your direct reports.</p>
        </div>
        <div className="overview-header-actions">
          <button className="overview-btn-outline" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Report
          </button>
          <button className="overview-btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAssignModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Assign Task
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="overview-stats-row">
            <div className="overview-stat-card cursor-pointer hover:border-amber transition-colors" onClick={() => navigate('/lead/incentives')}>
              <div className="overview-stat-header">
                <div className="overview-stat-icon-box" style={{ background: '#fdf3e1', color: '#b89047' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <span className="overview-stat-trend-up">↗ +12%</span>
              </div>
              <div className="overview-stat-label">TEAM INCENTIVES FORECAST</div>
              <div className="overview-stat-value">
                ₹{employeesList.reduce((sum, e) => sum + (e.incentiveEarned || 0), 0).toLocaleString()}
              </div>
              <div className="overview-stat-desc">Total team payouts</div>
            </div>

            <div className="overview-stat-card cursor-pointer hover:border-amber transition-colors" onClick={() => navigate('/lead/tasks')}>
              <div className="overview-stat-header">
                <div className="overview-stat-icon-box" style={{ background: '#e8f0fe', color: '#3d7cf0' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <span className="overview-stat-trend-up">Live</span>
              </div>
              <div className="overview-stat-label">TASKS ASSIGNED</div>
              <div className="overview-stat-value">{assignedTasksCount}</div>
              <div className="overview-stat-desc">{unassignedTasksCount} unassigned in queue</div>
            </div>

            <div className="overview-stat-card cursor-pointer hover:border-amber transition-colors" onClick={() => navigate('/lead/employees')}>
              <div className="overview-stat-header">
                <div className="overview-stat-icon-box" style={{ background: '#f4f5f9', color: '#8a8fa3' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div className="overview-stat-label">ACTIVE STAFF</div>
              <div className="overview-stat-value">{activeStaffCount} / {employeesList.length}</div>
              <div className="overview-stat-desc">{employeesList.filter(e => e.status !== 'Active').length} Inactive</div>
            </div>

            <div className="overview-stat-card cursor-pointer hover:border-amber transition-colors" onClick={() => navigate('/lead/employees')}>
              <div className="overview-stat-header">
                <div className="overview-stat-icon-box" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div className="overview-stat-label">ACTIVE TEAM MEMBERS</div>
              <div className="overview-stat-value">{activeStaffCount}</div>
              <div className="overview-stat-desc">Active members vs {inactiveStaffCount} inactive</div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="overview-main-grid">
            <div className="overview-left-col">
              <div className="overview-card attention-card">
                <div className="overview-card-header">
                  <h3 className="overview-card-title">
                    <span className="attention-icon">!</span> Attention Required
                  </h3>
                  <span className="attention-badge">{attentionRequiredData.length} Action Items</span>
                </div>
                <div className="overview-table-scroll">
                  {attentionRequiredData.length === 0 ? (
                    <div className="p-6 text-center text-sm text-ink-soft">
                      No team members require attention. All active experts are assigned.
                    </div>
                  ) : (
                    <table className="overview-table">
                      <thead>
                        <tr>
                          <th>EMPLOYEE</th><th>CURRENT STATUS</th>
                          <th>LAST ACTION</th><th>PERFORMANCE</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {attentionRequiredData.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <div className="overview-employee-cell">
                                <div className="overview-avatar">{row.initials}</div>
                                <div className="overview-employee-info">
                                  <span className="overview-employee-name">{row.employee}</span>
                                  <span className="overview-employee-role">{row.role}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`overview-status-badge badge-${row.statusType}`}>
                                {row.statusType === 'danger' && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                )}
                                {row.statusType === 'info' && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                                )}
                                {row.status}
                              </span>
                            </td>
                            <td className="overview-action-time">{row.lastAction}</td>
                            <td>
                              <div className="overview-performance-wrap">
                                <div className="overview-performance-track">
                                  <div className="overview-performance-fill" style={{ width: `${row.performance}%` }} />
                                </div>
                                <span className="overview-performance-text">{row.performance}%</span>
                              </div>
                            </td>
                            <td className="overview-action-td">
                              <button className="overview-action-btn" onClick={() => handleAction(row.actionLabel, row.id)}>
                                {row.actionLabel}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <button className="overview-footer-btn" onClick={() => navigate('/lead/employees')}>
                  View All Team Members ({employeesList.length})
                </button>
              </div>
            </div>

            <div className="overview-right-col">
              {/* Leaderboard */}
              <div className="overview-card leaderboard-card">
                <div className="leaderboard-header">
                  <h3 className="overview-card-title">Leaderboard</h3>
                  <p className="leaderboard-subtitle">Top incentive projection scorers</p>
                </div>
                <div className="leaderboard-list">
                  {leaderboardData.length === 0 ? (
                    <div className="p-4 text-center text-sm text-ink-soft">
                      No leaderboard data.
                    </div>
                  ) : (
                    leaderboardData.map((item) => (
                      <div className="leaderboard-item" key={item.rank}>
                        <div className="leaderboard-row">
                          <span className="leaderboard-rank">{item.rank}</span>
                          <span className="leaderboard-name">{item.name}</span>
                          <span className="leaderboard-amount">{item.amount}</span>
                        </div>
                        <div className="leaderboard-track">
                          <div className="leaderboard-fill" style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button className="overview-footer-btn" onClick={() => navigate('/lead/incentives')}>
                  Full Incentive Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Progress Documents Section */}
          <div className="overview-card mt-6" style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e7e9f1' }}>
            <div className="overview-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="overview-card-title" style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                📁 Team Progress Documents
              </h3>
              <span className="attention-badge" style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: '#fdf3e1', color: '#b89047', fontWeight: 600 }}>
                {docsList.filter(d => !d.isVerified).length} Pending Verification
              </span>
            </div>
            <div className="overview-table-scroll" style={{ overflowX: 'auto' }}>
              {docsList.length === 0 ? (
                <div className="p-6 text-center text-sm text-ink-soft">
                  No progress documents have been uploaded by team members.
                </div>
              ) : (
                <table className="overview-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #e7e9f1' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#8a8fa3' }}>FILE NAME</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#8a8fa3' }}>UPLOADED DATE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#8a8fa3' }}>EMPLOYEE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#8a8fa3' }}>REMARKS</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#8a8fa3' }}>STATUS</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#8a8fa3', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsList.map((doc: any) => {
                      const empName = doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : (doc.uploadedBy || 'Employee');
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #f1f3f9' }}>
                          <td style={{ padding: '14px 16px', fontSize: 14 }}>
                            <a href={doc.fileUrl || doc.filePath} target="_blank" rel="noopener noreferrer" style={{ color: '#3d7cf0', fontWeight: 600 }} className="hover:underline">
                              {doc.fileName}
                            </a>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#4a5568' }}>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500 }}>
                            {empName}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#718096', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.remarks}>
                            {doc.remarks || '—'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {doc.isVerified ? (
                              <span style={{ padding: '3px 8px', borderRadius: 4, background: '#e6fffa', color: '#319795', fontSize: 11, fontWeight: 700 }}>Verified</span>
                            ) : (
                              <span style={{ padding: '3px 8px', borderRadius: 4, background: '#fffaf0', color: '#dd6b20', fontSize: 11, fontWeight: 700 }}>Pending</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <a
                                href={doc.fileUrl || doc.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ padding: '4px 8px', background: '#edf2f7', color: '#4a5568', borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                              >
                                View/Download
                              </a>
                              {!doc.isVerified && (
                                <button
                                  onClick={() => handleVerifyProgressDoc(doc.id)}
                                  style={{ padding: '4px 8px', background: '#b89047', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                                >
                                  Verify Progress
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {showAssignModal && (
        <div className="overview-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="overview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Assign New Task</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Task Title</label>
                <input
                  type="text"
                  placeholder="Enter task name..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Select Employee</label>
                <select
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                >
                  <option value="">Choose an employee...</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Select Client</label>
                <select
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">Choose a client...</option>
                  {clientsList.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.company}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Priority</label>
                <select
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Standard">Standard</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                className="overview-btn-outline"
                onClick={() => {
                  setShowAssignModal(false)
                  setTaskName('')
                  setSelectedEmp('')
                  setSelectedClient('')
                  setTaskPriority('Standard')
                }}
              >
                Cancel
              </button>
              <button
                className="overview-btn-gold"
                disabled={assigning}
                style={{ opacity: assigning ? 0.7 : 1, cursor: assigning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={async () => {
                  if (!taskName.trim()) {
                    toast({ message: 'Task name is required', type: 'error' })
                    return
                  }
                  if (!selectedEmp) {
                    toast({ message: 'Please select an employee', type: 'error' })
                    return
                  }
                  if (!selectedClient) {
                    toast({ message: 'Please select a client', type: 'error' })
                    return
                  }

                  setAssigning(true)
                  try {
                    const priorityMap: Record<string, string> = {
                      'Low': 'LOW',
                      'Standard': 'MEDIUM',
                      'High': 'HIGH',
                      'Critical': 'URGENT'
                    }
                    const priority = priorityMap[taskPriority] || 'MEDIUM'

                    await taskService.createTask({
                      name: taskName,
                      description: 'Task auto-assigned from Team Lead Console',
                      priority,
                      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                      clientId: parseInt(selectedClient),
                      assignedEmployeeId: parseInt(selectedEmp)
                    })

                    const empObj = employeesList.find(e => e.id === selectedEmp)
                    const empName = empObj ? empObj.name : 'selected employee'

                    toast({ message: `Task "${taskName}" successfully assigned to ${empName}!`, type: 'success' })

                    // Reset modal state
                    setShowAssignModal(false)
                    setTaskName('')
                    setSelectedEmp('')
                    setSelectedClient('')
                    setTaskPriority('Standard')

                    // Notify all pages of the changes, then re-fetch dashboard data
                    window.dispatchEvent(new CustomEvent('tasks:changed'))
                    window.dispatchEvent(new CustomEvent('employees:changed'))
                    await fetchDashboardData()
                  } catch (err: any) {
                    toast({ message: err.message || 'Failed to assign task', type: 'error' })
                  } finally {
                    setAssigning(false)
                  }
                }}
              >
                {assigning ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Assigning...
                  </>
                ) : 'Assign Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
