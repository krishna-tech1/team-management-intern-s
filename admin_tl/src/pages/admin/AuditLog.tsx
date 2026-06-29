import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Search, FileMinus2, RefreshCw, MoreHorizontal, ChevronRight, AlertCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { downloadCsv } from '@/lib/utils'
import { auditLogService } from "@/services/auditLogService"
import Spinner from "@/components/ui/Spinner"

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState("Last 7 Days")
  const [filterUser, setFilterUser] = useState("All Users")
  const [filterAction, setFilterAction] = useState("All Actions")
  const [filterModule, setFilterModule] = useState("All Modules")
  const [filterStatus, setFilterStatus] = useState("All Statuses")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await auditLogService.getAuditLogs()
      // Map database logs to the shape the UI expects
      const mapped = data.map((l: any) => ({
        id: String(l.id),
        timestamp: l.createdAt,
        user: l.performedBy || 'System',
        action: l.action || 'Performed action',
        module: l.module || l.entity || 'System',
        ip: 'N/A', // Not stored in DB
        status: 'Success',
        description: l.action || 'Filing process completed',
        oldValue: null,
        newValue: null,
        metadata: {}
      }))
      setLogs(mapped)
      if (mapped.length > 0) {
        setSelectedId(mapped[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const users = useMemo(() => ["All Users", ...Array.from(new Set(logs.map((l) => l.user)))], [logs])
  const actions = useMemo(() => ["All Actions", ...Array.from(new Set(logs.map((l) => l.action)))], [logs])
  const modules = useMemo(() => ["All Modules", ...Array.from(new Set(logs.map((l) => l.module)))], [logs])
  const statuses = useMemo(() => ["All Statuses", ...Array.from(new Set(logs.map((l) => l.status)))], [logs])

  function matchesSearch(l: any, q: string) {
    if (!q) return true
    const s = q.toLowerCase()
    return (
      String(l.user).toLowerCase().includes(s) ||
      String(l.action).toLowerCase().includes(s) ||
      String(l.module).toLowerCase().includes(s) ||
      String(l.ip || "").toLowerCase().includes(s) ||
      String(l.description || "").toLowerCase().includes(s)
    )
  }

  function inDateRange(ts: string, range: string) {
    if (range === "All Time") return true
    const d = new Date(ts)
    const now = new Date()
    const days = range === "Last 7 Days" ? 7 : range === "Last 30 Days" ? 30 : 3650
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return d >= cutoff
  }

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (!matchesSearch(l, search)) return false
      if (filterUser !== "All Users" && l.user !== filterUser) return false
      if (filterAction !== "All Actions" && l.action !== filterAction) return false
      if (filterModule !== "All Modules" && l.module !== filterModule) return false
      if (filterStatus !== "All Statuses" && l.status !== filterStatus) return false
      if (!inDateRange(l.timestamp, dateRange)) return false
      return true
    })
  }, [logs, search, filterUser, filterAction, filterModule, filterStatus, dateRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = useMemo(() => {
    return filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  }, [filtered, page, rowsPerPage])

  const selectedLog = useMemo(() => logs.find((l) => l.id === selectedId) ?? pageItems[0] ?? null, [logs, selectedId, pageItems])

  function resetFilters() {
    setSearch("")
    setDateRange("Last 7 Days")
    setFilterUser("All Users")
    setFilterAction("All Actions")
    setFilterModule("All Modules")
    setFilterStatus("All Statuses")
    setPage(1)
  }

  function exportCsv() {
    const rows = filtered.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      user: r.user,
      action: r.action,
      module: r.module,
      ip: r.ip,
      status: r.status,
      description: r.description,
    }))
    if (rows.length === 0) return
    downloadCsv(rows, `audit-logs-${new Date().toISOString()}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Comprehensive history of all system activities and user actions."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search logs, actions, or IPs..."
                className="h-11 w-96 rounded-lg border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-amber focus:outline-none"
              />
            </div>
            <Button variant="outline" icon={<FileMinus2 size={16} />} onClick={exportCsv}>Export CSV</Button>
            <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={loadData}>Refresh Logs</Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <Button variant="outline" onClick={loadData}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="flex gap-6 animate-fadeIn">
          <div className="flex-1">
            <Card>
              <div className="p-6">
                {/* Filter toolbar — single row on desktop, wraps on tablet, stacks on mobile */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                  {/* Date Filter */}
                  <select
                    value={dateRange}
                    onChange={(e) => { setDateRange(e.target.value); setPage(1) }}
                    className="h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink sm:w-40"
                  >
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>All Time</option>
                  </select>

                  {/* User Filter */}
                  <select
                    value={filterUser}
                    onChange={(e) => { setFilterUser(e.target.value); setPage(1) }}
                    className="h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink sm:w-44"
                  >
                    {users.map((u) => <option key={u}>{u}</option>)}
                  </select>

                  {/* Action Filter */}
                  <select
                    value={filterAction}
                    onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
                    className="h-12 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm text-ink sm:min-w-[200px] sm:flex-1"
                  >
                    {actions.map((a) => <option key={a}>{a}</option>)}
                  </select>

                  {/* Module Filter */}
                  <select
                    value={filterModule}
                    onChange={(e) => { setFilterModule(e.target.value); setPage(1) }}
                    className="h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink sm:w-44"
                  >
                    {modules.map((m) => <option key={m}>{m}</option>)}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
                    className="h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink sm:w-44"
                  >
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>

                  {/* Reset Filters */}
                  <button
                    onClick={resetFilters}
                    className="h-12 w-full whitespace-nowrap rounded-lg border border-line bg-surface px-6 text-sm font-medium text-ink hover:bg-line-soft sm:w-auto"
                  >
                    Reset Filters
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left text-sm text-ink-muted font-semibold uppercase tracking-wider bg-surface-muted border-b border-line">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-4">IP Address</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-ink-muted">No audit logs found</td>
                        </tr>
                      )}
                      {pageItems.map((r: any) => (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedId(r.id)}
                          className={`border-b border-line-soft cursor-pointer hover:bg-surface-muted transition-colors ${selectedId === r.id ? 'bg-line-soft' : ''}`}
                        >
                          <td className="py-3.5 px-4 align-middle text-sm text-ink-soft">{new Date(r.timestamp).toLocaleString()}</td>
                          <td className="py-3.5 px-4 align-middle text-sm text-ink font-medium">{r.user}</td>
                          <td className="py-3.5 px-4 align-middle text-sm text-ink-soft">{r.action}</td>
                          <td className="py-3.5 px-4 align-middle text-sm text-ink-soft">{r.module}</td>
                          <td className="py-3.5 px-4 align-middle text-sm text-ink-soft">{r.ip}</td>
                          <td className="py-3.5 px-4 align-middle text-sm">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === 'Success' ? 'bg-green-50 text-success' : 'bg-amber-50 text-gold-dark'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-middle text-sm text-right">
                            <ChevronRight size={16} className="text-ink-soft inline" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-ink-muted">Showing {(filtered.length === 0) ? 0 : (page - 1) * rowsPerPage + 1} - {(page - 1) * rowsPerPage + pageItems.length} of {filtered.length} entries</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded border border-line bg-surface hover:bg-line-soft transition-colors">&lt;</button>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button key={idx} onClick={() => setPage(idx + 1)} className={`px-3 py-1 rounded transition-colors ${page === idx + 1 ? 'bg-amber text-white font-bold' : 'border border-line bg-surface hover:bg-line-soft'}`}>{idx + 1}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded border border-line bg-surface hover:bg-line-soft transition-colors">&gt;</button>
                    <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }} className="ml-2 h-8 rounded border border-line bg-surface px-2 text-sm text-ink">
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <aside className="w-96">
            <Card>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Activity Details</h3>
                    <div className="text-xs text-ink-muted">Log ID: {selectedLog?.id ?? '—'}</div>
                  </div>
                  <button className="p-2 rounded hover:bg-line-soft text-ink-soft"><MoreHorizontal size={16} /></button>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-line p-3 bg-surface">
                    <div className="text-xs text-ink-muted">User</div>
                    <div className="font-semibold text-ink">{selectedLog?.user ?? '—'}</div>
                  </div>
                  <div className="rounded-lg border border-line p-3 bg-surface">
                    <div className="text-xs text-ink-muted">Timestamp</div>
                    <div className="font-semibold text-ink">{selectedLog ? new Date(selectedLog.timestamp).toLocaleString() : '—'}</div>
                  </div>
                  <div className="rounded-lg border border-line p-3 bg-surface">
                    <div className="text-xs text-ink-muted">Module</div>
                    <div className="font-semibold text-ink">{selectedLog?.module ?? '—'}</div>
                  </div>
                  <div className="rounded-lg border border-line p-3 bg-surface">
                    <div className="text-xs text-ink-muted">Action Type</div>
                    <div className="font-semibold text-ink">{selectedLog?.action ?? '—'}</div>
                  </div>
                  <div className="rounded-lg border border-line p-3 bg-surface">
                    <div className="text-xs text-ink-muted">IP Address</div>
                    <div className="font-semibold text-ink">{selectedLog?.ip ?? '—'}</div>
                  </div>
                  <div className="rounded-lg border border-line p-3 bg-surface">
                    <div className="text-xs text-ink-muted">Status</div>
                    <div className="font-semibold text-ink">{selectedLog?.status ?? '—'}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-ink-muted">Description</div>
                  <div className="mt-2 rounded-lg border border-line p-3 bg-surface text-sm text-ink-soft">{selectedLog?.description ?? '—'}</div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-ink-muted">Change Comparison</div>
                  <div className="mt-2">
                    <div className="rounded-lg border border-line p-3 bg-danger-soft text-sm text-danger">{selectedLog?.oldValue ?? '—'}</div>
                    <div className="rounded-lg border border-line p-3 bg-success-soft text-sm text-success mt-3">{selectedLog?.newValue ?? '—'}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full rounded-lg bg-amber text-white py-3 font-semibold hover:bg-gold-dark transition-colors">Flag this Action for Review</button>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}
