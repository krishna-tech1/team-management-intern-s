import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { DonutChart } from '@/components/ui/DonutChart'
import { Avatar } from '@/components/ui/Avatar'
import { Search, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DashboardGrid } from '@/components/ui/ResponsiveGrid'
import { clientService } from '@/services/clientService'
import { taskService } from '@/services/taskService'
import { analyticsService, type AnalyticsStats } from '@/services/analyticsService'
import { type Client } from '@/data/clients'
import { type Task } from '@/data/tasks'

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 py-4 px-4 border-b border-line bg-white">
      <div className="h-6 w-6 rounded bg-line" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/5 bg-line rounded" />
        <div className="h-2 w-1/3 bg-line rounded mt-2" />
      </div>
      <div className="h-6 w-20 bg-line rounded" />
    </div>
  )
}

interface AnalyticsRowData {
  client: Client
  task: Task
  employees: string[]
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [tasksList, setTasksList] = useState<Task[]>([])
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [q, setQ] = useState('')
  const filterStatus = ''
  const filterClient = ''
  const filterEmployee = ''
  const [page, setPage] = useState(1)
  const pageSize = 10

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [clis, tsks, analyticsStats] = await Promise.all([
        clientService.getClients(),
        taskService.getTasks(),
        analyticsService.getAnalyticsRows()
      ])
      setClientsList(clis)
      setTasksList(tsks)
      setStats(analyticsStats)
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo<AnalyticsRowData[]>(() => {
    let list = tasksList.map((t) => {
      const c = clientsList.find(cli => cli.company === t.client) || ({
        id: t.id,
        company: t.client || 'Unknown Client',
        employees: t.employee ? [t.employee] : []
      } as unknown as Client)
      return {
        client: c,
        task: t,
        employees: t.employee ? [t.employee] : []
      }
    })
    if (q) list = list.filter(r => `${r.client.company} ${r.task?.name}`.toLowerCase().includes(q.toLowerCase()))
    if (filterStatus) list = list.filter(r => r.task?.status === filterStatus)
    if (filterClient) list = list.filter(r => r.client.id === filterClient)
    if (filterEmployee) list = list.filter(r => r.employees.includes(filterEmployee))
    return list
  }, [tasksList, clientsList, q, filterStatus, filterClient, filterEmployee])

  const total = rows.length
  const pageItems = rows.slice((page-1)*pageSize, page*pageSize)

  const totalClientsCount = clientsList.length
  const complianceRate = stats?.taskCompletionRate?.rate ?? 0
  const pendingFilingsCount = tasksList.filter(t => t.status !== 'Completed').length

  const navigate = useNavigate()
  function handleNewTask() {
    navigate('/tasks/create')
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-ink-soft">Admin / Client Assignments</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Precision Task Tracking</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-semibold shadow" onClick={handleNewTask}>+ New Task</button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <button
            onClick={loadData}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <DashboardGrid>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-ink-muted">Client Summary</h3>
            <div className="mt-4 text-3xl font-extrabold">
              {loading ? '...' : totalClientsCount}
            </div>
            <div className="text-sm text-ink-muted mt-2">Total clients</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-ink-muted">Compliance Rate</h3>
            <div className="mt-4 flex items-center gap-4">
              <DonutChart percent={loading ? 0 : complianceRate} size={100} />
              <div>
                <div className="text-xl font-bold">
                  {loading ? '...' : `${complianceRate}%`}
                </div>
                <div className="text-sm text-ink-muted">Average across clients</div>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-ink-muted">Pending Filings</h3>
            <div className="mt-4 text-2xl font-bold">
              {loading ? '...' : pendingFilingsCount}
            </div>
            <div className="text-sm text-ink-muted mt-2">Awaiting client responses</div>
          </div>
        </Card>
      </DashboardGrid>

      <Card className="mt-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-ink-muted" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Filter by Client or Task..." className="pl-10 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" />
            </div>
            <button className="h-11 px-4 rounded-lg border border-line bg-surface text-sm w-full md:w-auto">Advanced Filters</button>
            <div className="mt-2 md:mt-0 ml-0 md:ml-auto flex items-center gap-2 text-sm text-ink-muted">Sort by: <select className="ml-2 h-9 rounded border border-line bg-white px-2 w-full md:w-auto"><option>Latest Activity</option></select></div>
          </div>
        </div>

        <div className="border-t border-line p-0 max-w-full overflow-x-hidden">
          <div className="grid grid-cols-12 gap-0 text-xs uppercase font-semibold text-ink-muted px-4 py-3 bg-surface w-full max-w-full">
            <div className="col-span-4 min-w-0">Client Name</div>
            <div className="col-span-4 min-w-0">Task Name</div>
            <div className="col-span-2 min-w-0">Employees Worked</div>
            <div className="col-span-1 min-w-0">Status</div>
            <div className="col-span-1 min-w-0">Actions</div>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : total === 0 ? (
            <div className="flex h-32 items-center justify-center text-ink-soft bg-white">
              No task assignments found.
            </div>
          ) : (
            <div>
              {pageItems.map((r) => (
                <div key={`${r.client.id}-${r.task.id}`} className="grid grid-cols-12 items-center gap-0 px-4 py-4 border-b border-line hover:bg-white/60 transition-colors w-full max-w-full">
                  <div className="col-span-4 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.client.company}</div>
                    <div className="text-xs text-ink-muted mt-1 truncate">CRN: {r.client.id}</div>
                  </div>
                  <div className="col-span-4 text-sm min-w-0 truncate">{r.task?.name}</div>
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    {r.employees.slice(0,2).map(e => <Avatar key={e} name={e} size={28} />)}
                    {r.employees.length > 2 && <div className="rounded-full bg-surface px-2 text-xs">+{r.employees.length-2}</div>}
                  </div>
                  <div className="col-span-1 min-w-0">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${r.task?.status === 'Completed' ? 'bg-green-50 text-success' : r.task?.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : r.task?.status === 'Waiting For Client' ? 'bg-pink-50 text-rose-600' : 'bg-line text-ink-muted'}`}>
                      {r.task?.status}
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-sm text-ink-muted">…</div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 flex items-center justify-between text-sm text-ink-muted">
            <div>Showing {total === 0 ? 0 : (page-1)*pageSize+1}-{Math.min(page*pageSize, total)} of {total} client tasks</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 rounded border border-line">Prev</button>
              <div className="px-3 py-1 rounded bg-amber-600 text-white">{page}</div>
              <button onClick={() => setPage(p => p+1)} className="px-3 py-1 rounded border border-line">Next</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

