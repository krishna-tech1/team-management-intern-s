import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, UserRoundPlus, ListPlus, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { KpiCard } from "@/components/ui/KpiCard"
import { DashboardGrid } from '@/components/ui/ResponsiveGrid'
import { Card, CardHeader } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { DonutChart } from "@/components/ui/DonutChart"
import Spinner from "@/components/ui/Spinner"
import { analyticsService, type DashboardStats } from "@/services/analyticsService"

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    setError(null)
    analyticsService.getDashboardStats()
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard metrics')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  const ranking = stats?.topPerformers ?? []
  const totalClients = stats?.clients ?? 0
  const activeStaff = stats?.activeEmployees ?? 0
  const openTasks = (stats?.tasks ?? 0) - (stats?.completedTasks ?? 0)

  const completedTasksCount = stats?.completedTasks ?? 0
  const inProgressTasksCount = stats?.inProgressTasks ?? 0
  const totalTasks = stats?.tasks ?? 0
  
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasksCount / totalTasks) * 100) 
    : 0

  return (
    <div>
      <PageHeader
        title="System Performance"
        actions={
          <>
            <Button variant="outline" icon={<UserPlus className="h-4 w-4" />} onClick={() => navigate("/clients/add")}>
              Add Client
            </Button>
            <Button variant="outline" icon={<UserRoundPlus className="h-4 w-4" />} onClick={() => navigate("/employees/add")}>
              Add Employee
            </Button>
            <Button variant="primary" icon={<ListPlus className="h-4 w-4" />} onClick={() => navigate("/tasks/create")}>
              Assign Task
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          <DashboardGrid>
            <KpiCard label="Total Clients" value={String(totalClients)} meta="↗ 12%" metaTone="success" sub="Active across jurisdictions" accent="gold" />
            <KpiCard label="Active Staff" value={String(activeStaff)} meta="Stable" metaTone="neutral" sub="Active field experts" accent="info" />
            <KpiCard label="Open Tasks" value={String(openTasks)} meta="Active" metaTone="danger" sub="Awaiting review or in progress" accent="warning" />
          </DashboardGrid>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Employee Ranking (Efficiency)"
                action={
                  <button onClick={() => navigate("/employees")} className="text-sm font-semibold text-gold-dark hover:underline">
                    View Full Table
                  </button>
                }
              />
              <div className="overflow-x-auto">
                {ranking.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-ink-soft">
                    No high efficiency employees found.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-y border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        <th className="px-6 py-3">Rank</th>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Team</th>
                        <th className="px-6 py-3">Tasks Closed</th>
                        <th className="px-6 py-3">Efficiency</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((emp, index) => (
                        <tr
                          key={emp.id}
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-surface-muted"
                        >
                          <td className="px-6 py-3.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-soft text-xs font-bold text-gold-dark">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={emp.name} src={emp.avatar ?? undefined} size={34} />
                              <span className="text-sm font-bold text-ink">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-ink-soft">{emp.department ?? 'GST'}</td>
                          <td className="px-6 py-3.5 text-sm font-bold text-ink">{emp.tasksClosed}</td>
                          <td className="px-6 py-3.5">
                            <div className="w-28">
                              <ProgressBar value={emp.efficiency} />
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status="ELITE" tone="success" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Task Completion" />
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-amber-tint p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">In Progress</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">
                      {inProgressTasksCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-tint p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Completed</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">
                      {completedTasksCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <DonutChart percent={completionRate} label="Closed" />
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Completed
                    </span>
                    <span className="text-sm font-bold text-ink">{completedTasksCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="h-2.5 w-2.5 rounded-full bg-line" /> In Progress
                    </span>
                    <span className="text-sm font-bold text-ink">{inProgressTasksCount}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
