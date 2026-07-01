import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BellRing, CheckCheck, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"

type NotificationItem = {
  id: string
  title: string
  description: string
  time: string
  route: string
  read?: boolean
}

const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "GST filing reminder",
    description: "Q3 filing for Acme Global is due in 2 days.",
    time: "2h ago",
    route: "/tasks",
  },
  {
    id: "n2",
    title: "New employee added",
    description: "Anita Mishra was onboarded successfully.",
    time: "1d ago",
    route: "/employees",
  },
  {
    id: "n3",
    title: "Client update",
    description: "A new allocation request is waiting for review.",
    time: "3d ago",
    route: "/clients",
  },
]

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState(initialNotifications)

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  const markAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Review recent activity and open the related records directly."
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-2 text-amber-700">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Inbox</div>
              <div className="text-xs text-ink-muted">{unreadCount} unread notifications</div>
            </div>
          </div>
          <Button variant="outline" onClick={markAllRead} icon={<CheckCheck className="h-4 w-4" />}>
            Mark all read
          </Button>
        </div>

        <div className="divide-y divide-line">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-ink-muted">No notifications available.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.read ? "bg-line" : "bg-amber-500"}`} />
                  <div>
                    <div className="text-sm font-semibold text-ink">{item.title}</div>
                    <div className="text-sm text-ink-soft">{item.description}</div>
                    <div className="mt-1 text-xs text-ink-muted">{item.time}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigate(item.route)}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Open
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
