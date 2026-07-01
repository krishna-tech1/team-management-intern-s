import { useMemo, useState } from "react"
import { Card, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Users, Briefcase, ArrowRight, UserRoundPlus, CheckCircle2 } from "lucide-react"

const sampleEmployees = [
  { id: "EMP-101", name: "Aarav Sharma", team: "GST", role: "Compliance Associate" },
  { id: "EMP-102", name: "Nisha Patel", team: "MCA", role: "Filings Associate" },
  { id: "EMP-103", name: "Rohan Verma", team: "GST", role: "Senior Associate" },
]

const sampleTLs = [
  { id: "TL-001", name: "Vikram Shah", team: "GST" },
  { id: "TL-002", name: "Meera Joseph", team: "MCA" },
]

export default function AssignTL() {
  const [selectedEmployee, setSelectedEmployee] = useState(sampleEmployees[0]?.id ?? "")
  const [selectedTL, setSelectedTL] = useState(sampleTLs[0]?.id ?? "")
  const [submitted, setSubmitted] = useState(false)

  const selectedEmployeeData = useMemo(
    () => sampleEmployees.find((employee) => employee.id === selectedEmployee),
    [selectedEmployee],
  )

  const selectedTLData = useMemo(() => sampleTLs.find((tl) => tl.id === selectedTL), [selectedTL])

  const handleAssign = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="px-3 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Assign Team Lead</h1>
        <p className="mt-1 text-sm text-ink-soft">Frontend assignment flow for linking employees to team leads.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader title="Assign Team Lead" />
          <div className="px-6 pb-6">
            <form className="space-y-4" onSubmit={handleAssign}>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(event) => {
                    setSelectedEmployee(event.target.value)
                    setSubmitted(false)
                  }}
                  className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                >
                  {sampleEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.team})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Team Lead</label>
                <select
                  value={selectedTL}
                  onChange={(event) => {
                    setSelectedTL(event.target.value)
                    setSubmitted(false)
                  }}
                  className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                >
                  {sampleTLs.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.name} ({tl.team})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-line bg-surface-muted p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <UserRoundPlus className="h-4 w-4 text-amber-600" />
                  Preview assignment
                </div>
                <div className="mt-3 space-y-2 text-sm text-ink-soft">
                  <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2">
                    <Users className="h-4 w-4" />
                    <span>{selectedEmployeeData?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{selectedTLData?.name ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" icon={<ArrowRight className="h-4 w-4" />}>
                  Assign TL
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <Card>
          <CardHeader title="Assignment Summary" />
          <div className="px-6 pb-6">
            <div className="rounded-lg border border-line bg-white p-4 text-sm text-ink-soft">
              <p className="font-semibold text-ink">Selected employee</p>
              <p className="mt-1">{selectedEmployeeData?.name ?? "No employee selected"}</p>
              <p className="mt-1 text-xs">{selectedEmployeeData?.role ?? "—"}</p>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-white p-4 text-sm text-ink-soft">
              <p className="font-semibold text-ink">Selected team lead</p>
              <p className="mt-1">{selectedTLData?.name ?? "No team lead selected"}</p>
              <p className="mt-1 text-xs">{selectedTLData?.team ?? "—"}</p>
            </div>
            {submitted && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Assignment is ready for backend integration and can be confirmed from the team lead console.</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
