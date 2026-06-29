import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/components/ui/Toast'
import { DonutChart } from '@/components/ui/DonutChart'
import Spinner from '@/components/ui/Spinner'
import { AlertCircle } from 'lucide-react'
import { clientService } from '@/services/clientService'
import { employeeService } from '@/services/employeeService'
import { allocationService } from '@/services/allocationService'
import { type Client } from '@/data/clients'
import { type Employee } from '@/data/employees'

export default function ManageAllocation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [assignedMap, setAssignedMap] = useState<Record<string, string[]>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ lead: string; clientId: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [cli, clis, emps] = await Promise.all([
        clientService.getClientById(id),
        clientService.getClients(),
        employeeService.getEmployees()
      ])
      setClient(cli)
      setClientsList(clis)
      setEmployeesList(emps)
      
      // build assigned map from clients data grouped by team lead
      const map: Record<string, string[]> = {}
      clis.forEach((c) => {
        const lead = c.assignedTL || 'Unassigned'
        map[lead] = map[lead] || []
        map[lead].push(c.id)
      })
      setAssignedMap(map)
    } catch (err: any) {
      setError(err.message || 'Failed to load allocation data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="text-center text-ink-soft p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-semibold">{error || 'Client not found'}</p>
        <p className="mt-2">The client you are looking for does not exist or loading failed.</p>
        <div className="mt-4 flex gap-3 justify-center">
          <Button variant="outline" onClick={loadData}>Retry</Button>
          <Button variant="outline" onClick={() => navigate('/clients')}>Back to Clients</Button>
        </div>
      </div>
    )
  }

  // All clients except the current one
  const pool = clientsList.filter((c) => c.id !== client.id)

  const leads = Array.from(new Set([
    ...employeesList.filter(e => e.designation?.toLowerCase().includes('lead') || e.team === 'GST').map(e => e.name),
    ...clientsList.map(c => c.assignedTL)
  ])).filter(l => l && l !== 'Unassigned')

  function toggleSelectClient(cid: string) {
    setSelectedClients((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]))
  }

  function confirmRemoveAllocation(lead: string, cid: string) {
    setRemoveTarget({ lead, clientId: cid })
    setConfirmOpen(true)
  }

  function doRemove() {
    if (!removeTarget) return
    const { lead, clientId } = removeTarget
    setAssignedMap((m) => ({ ...m, [lead]: (m[lead] || []).filter((x) => x !== clientId) }))
    setRemoveTarget(null)
    setConfirmOpen(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates: Array<() => Promise<any>> = []
      
      for (const lead of Object.keys(assignedMap)) {
        const clientIds = assignedMap[lead] || []
        const leadEmp = employeesList.find(e => e.name === lead)
        
        for (const cid of clientIds) {
          const c = clientsList.find(x => x.id === cid)
          if (!c) continue
          
          if (lead === 'Unassigned') {
            if (c.assignedTL !== 'Unassigned') {
              updates.push(() => clientService.updateClient(cid, { assignedEmployeeId: null }))
            }
          } else if (leadEmp) {
            if (c.assignedTL !== lead) {
              updates.push(() => allocationService.allocateClient(Number(cid), Number(leadEmp.id)))
            }
          }
        }
      }

      await Promise.all(updates.map(up => up()))
      toast({ type: 'success', message: 'Allocation saved' })
      loadData()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAssign = async () => {
    if (selectedClients.length === 0) {
      toast({ type: 'error', message: 'No clients selected' })
      return
    }
    const leadName = prompt(`Enter Team Lead name to assign ${selectedClients.length} clients to (e.g. Vikram Malhotra):`)
    if (!leadName) return
    
    const leadEmp = employeesList.find(
      (e) => e.name.toLowerCase().includes(leadName.toLowerCase())
    )
    if (!leadEmp) {
      toast({ type: 'error', message: 'Team Lead not found' })
      return
    }

    setSaving(true)
    try {
      await Promise.all(
        selectedClients.map((cid) => 
          allocationService.allocateClient(Number(cid), Number(leadEmp.id))
        )
      )
      toast({ type: 'success', message: 'Bulk assignment completed' })
      setSelectedClients([])
      loadData()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Bulk assignment failed' })
      setSaving(false)
    }
  }

  function handleDragStart(e: React.DragEvent, clientId: string) {
    e.dataTransfer.setData('text/plain', clientId)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDropOnLead(e: React.DragEvent, leadName: string) {
    e.preventDefault()
    const clientId = e.dataTransfer.getData('text/plain')
    if (!clientId) return

    setAssignedMap((prev) => {
      const copy = { ...prev }
      for (const key of Object.keys(copy)) {
        copy[key] = (copy[key] || []).filter(id => id !== clientId)
      }
      copy[leadName] = copy[leadName] || []
      if (!copy[leadName].includes(clientId)) {
        copy[leadName].push(clientId)
      }
      return copy
    })
  }

  const efficiency = employeesList.length > 0 
    ? Math.round(employeesList.reduce((s, e) => s + (e.score || 0), 0) / employeesList.length)
    : 0

  const LeadCard = ({ lead, clientsForLead }: { lead: string; clientsForLead: string[] }) => (
    <div className="rounded-lg bg-surface border border-line p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={lead} size={44} />
          <div>
            <div className="text-sm font-semibold text-ink">{lead}</div>
            <div className="text-xs text-ink-soft tracking-wide">TEAM LEAD</div>
          </div>
        </div>
        <div className="w-24 text-right">
          <div className="text-xs text-amber-900 font-semibold">LOAD</div>
          <div className="h-2 mt-2 rounded-full bg-line-soft overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, (clientsForLead.length / 6) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnLead(e, lead)}
        className="space-y-3 min-h-[120px]"
      >
        {clientsForLead.map((cid) => {
          const c = clientsList.find((x) => x.id === cid)
          if (!c) return null
          return (
            <div key={cid} className="flex items-center justify-between p-3 bg-white border border-line rounded-md">
              <div>
                <div className="text-sm font-medium text-ink">{c.company}</div>
                <div className="text-xs text-ink-soft">{c.serviceType}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs px-2 py-1 rounded-full bg-line-soft text-ink-soft">{c.pendingTasks ?? 0} tasks</div>
                <Button variant="ghost" size="sm" onClick={() => confirmRemoveAllocation(lead, cid)}>Remove</Button>
              </div>
            </div>
          )
        })}
        <div className="p-2 text-center text-xs text-ink-soft border border-dashed rounded-md">Drop Client Here</div>
      </div>
    </div>
  )

  const PoolItem = ({ c }: { c: Client }) => (
    <div 
      draggable
      onDragStart={(e) => handleDragStart(e, c.id)}
      className="flex items-center gap-3 p-3 rounded-md hover:shadow-sm border border-line bg-white cursor-grab active:cursor-grabbing"
    >
      <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleSelectClient(c.id)} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">{c.company}</div>
            <div className="text-xs text-ink-soft">{c.serviceType}</div>
          </div>
          <div className="text-xs text-ink-muted">#{c.id}</div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="text-xs rounded-md bg-line-soft px-2 py-1">Priority</div>
          <div className="text-xs text-ink-soft">Due in {Math.max(1, c.pendingTasks || 0)}d</div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Client Allocation</h1>
          <p className="mt-1 text-ink-soft">Assign clients to team leads and monitor ownership history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(`/clients/${client.id}`)}>Back</Button>
          <Button variant="primary" loading={saving} loadingText="Saving..." onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Card>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">Client Pool</div>
                <div className="text-xs text-ink-soft">{pool.length} clients</div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={(e) => { if (!e.target.checked) setSelectedClients([]); else setSelectedClients(pool.map(p => p.id)) }} /> Select All</label>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkAssign}>Bulk Assign</Button>
                </div>
              </div>
            </div>
            <div className="px-4 pb-6">
              <div className="space-y-3 max-h-[560px] overflow-y-auto">
                {pool.map((c) => (
                  <PoolItem key={c.id} c={c} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">Allocation Matrix</div>
                <div className="text-xs text-ink-soft">Organize clients by team leads</div>
              </div>
              <div className="text-xs text-ink-soft">Drag & drop or use actions</div>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {leads.map((lead) => (
                  <LeadCard key={lead} lead={lead} clientsForLead={assignedMap[lead] || []} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">Ownership History</div>
                <div className="text-xs text-ink-soft">REAL-TIME</div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {employeesList.slice(0, 6).map((e, i) => (
                  <div key={e.id ?? i} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-line-soft flex items-center justify-center text-sm font-semibold text-ink">{(e.name || '').split(' ').map(s => s[0]).slice(0,2).join('')}</div>
                    <div>
                      <div className="text-sm font-medium text-ink">{e.name}</div>
                      <div className="text-xs text-ink-soft">{e.designation} — {e.team}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-ink-soft">Total Efficiency</div>
                  <div className="text-lg font-semibold text-ink">{efficiency}%</div>
                </div>
                <DonutChart percent={efficiency} size={84} stroke={12} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} title="Remove allocation" message={`Remove ${removeTarget?.clientId} from ${removeTarget?.lead}?`} onCancel={() => setConfirmOpen(false)} onConfirm={doRemove} />
    </div>
  )
}
