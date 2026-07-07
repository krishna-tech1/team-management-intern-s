import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { Avatar } from "@/components/ui/Avatar"
import Spinner from "@/components/ui/Spinner"
import { AlertCircle } from "lucide-react"
import { clientService } from "@/services/clientService"
import { employeeService } from "@/services/employeeService"
import { allocationService, type Allocation } from "@/services/allocationService"
import { type Client } from "@/data/clients"
import { type Employee } from "@/data/employees"
import { toast } from "@/components/ui/Toast"

export default function AdminClientAllocation() {
  const navigate = useNavigate()
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [employeesList, setEmployeeList] = useState<Employee[]>([])
  const [allocationsList, setAllocationsList] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [clis, emps, allocs] = await Promise.all([
        clientService.getClients(),
        employeeService.getEmployees(),
        allocationService.getAllAllocations()
      ])
      setClientsList(clis)
      setEmployeeList(emps)
      setAllocationsList(allocs)
    } catch (err: any) {
      setError(err.message || 'Failed to load allocations data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData('text/plain', clientId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, employeeId: string) => {
    e.preventDefault()
    const clientId = e.dataTransfer.getData('text/plain')
    if (!clientId) return
    
    // Check if client is already assigned to this employee to avoid duplicate allocations
    const client = clientsList.find(c => c.id === clientId)
    const emp = employeesList.find(em => em.id === employeeId)
    if (client && emp && client.assignedTL === emp.name) {
      toast({ type: 'error', message: 'Client is already allocated to this employee' })
      return
    }

    try {
      await allocationService.allocateClient(Number(clientId), Number(employeeId))
      toast({ type: 'success', message: 'Allocation successful' })
      loadData()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Allocation failed' })
    }
  }

  const handleRemove = async (clientId: string) => {
    try {
      await clientService.updateClient(clientId, { assignedEmployeeId: null })
      toast({ type: 'success', message: 'Allocation removed' })
      loadData()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Failed to remove allocation' })
    }
  }

  const unassignedClients = clientsList.filter(
    (c) => c.assignedTL === 'Unassigned' || !c.assignedTL
  )

  const topLeads = employeesList.slice(0, 3)

  return (
    <div>
      <PageHeader title="Client Allocation" subtitle="Client Allocation - Traxa" />

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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="grid gap-6 animate-fadeIn" style={{ gridTemplateColumns: '320px 1fr 320px' }}>
          {/* Left: Client Pool */}
          <Card>
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted">Client Pool</p>
                  <p className="text-sm font-bold text-ink">Select from unassigned clients</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[560px] overflow-y-auto">
                {unassignedClients.length === 0 ? (
                  <div className="text-center text-xs text-ink-soft py-8">
                    No unassigned clients in pool.
                  </div>
                ) : (
                  unassignedClients.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      className="rounded-lg border border-line bg-surface p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <button onClick={() => navigate(`/clients/${c.id}`)} className="text-sm font-bold text-ink hover:text-gold-dark text-left">
                            {c.company}
                          </button>
                          <div className="text-xs text-ink-muted">{c.serviceType}</div>
                        </div>
                        <div className="text-xs text-ink-muted">#{c.id}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Middle: Allocation Matrix */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">Allocation Matrix</h2>
                <p className="text-sm text-ink-muted">Drag clients to assign them to team leads</p>
              </div>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {topLeads.map((emp) => {
                const assigned = clientsList.filter(
                  (c) => c.assignedTL === emp.name
                )

                return (
                  <Card key={emp.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} src={emp.avatar} size={40} />
                      <div>
                        <div className="text-sm font-bold text-ink">{emp.name}</div>
                        <div className="text-xs text-ink-muted">{emp.designation}</div>
                      </div>
                    </div>

                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, String(emp.id))}
                      className="mt-4 min-h-[180px] rounded-lg border border-dashed border-line bg-surface-muted p-3 space-y-2 flex flex-col justify-start"
                    >
                      {assigned.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink">
                          <span className="truncate flex-1 pr-1">{c.company}</span>
                          <button
                            onClick={() => handleRemove(c.id)}
                            className="text-red-500 hover:text-red-700 font-bold px-1"
                            title="Remove assignment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {assigned.length === 0 && (
                        <p className="text-sm text-ink-muted m-auto text-center">Drop client here</p>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Right: Ownership History */}
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-bold text-ink">Ownership History</h3>
              <div className="mt-3 space-y-3 text-sm text-ink-muted max-h-[560px] overflow-y-auto pr-1">
                {allocationsList.length === 0 ? (
                  <div className="text-center text-xs text-ink-soft py-8">
                    No allocation logs found.
                  </div>
                ) : (
                  allocationsList.map((alloc) => (
                    <div key={alloc.id} className="rounded-md border border-line p-3 bg-surface">
                      <div className="text-xs font-semibold text-ink truncate">
                        {alloc.client?.companyName || 'Client'} Assigned
                      </div>
                      <div className="text-xs text-ink-soft mt-1">
                        Assigned to {alloc.employee ? `${alloc.employee.firstName} ${alloc.employee.lastName}` : 'Unassigned'} — {new Date(alloc.allocatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
