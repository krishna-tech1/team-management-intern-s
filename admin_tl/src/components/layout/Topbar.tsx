import { Bell, HelpCircle, Search, Settings, Menu, X } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { Avatar } from "@/components/ui/Avatar"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Toasts, { toast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function Topbar({
  searchPlaceholder = "Search operations, filings, or teams...",
  userName,
  userRole,
  onOpenSidebar,
}: {
  searchPlaceholder?: string
  userName: string
  userRole: string
  onOpenSidebar?: () => void
}) {
  let timeout: number | undefined

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    if (timeout) window.clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('app:search', { detail: v }))
    }, 250)
  }

  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const [searchActive, setSearchActive] = useState(false)

  const notifRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const helpRef = useRef<HTMLDivElement | null>(null)
  const supportRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement | null>(null)

  // Outside-click handler — closes any open panel when clicking outside it
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (notifOpen && notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false)
      if (profileOpen && profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false)
      if (helpOpen && helpRef.current && !helpRef.current.contains(t)) setHelpOpen(false)
      if (supportOpen && supportRef.current && !supportRef.current.contains(t)) setSupportOpen(false)
      if (resultsOpen && searchRef.current && !searchRef.current.contains(t)) {
        setResultsOpen(false)
        setSearchActive(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [notifOpen, profileOpen, helpOpen, supportOpen, resultsOpen])

  const sampleNotifications = [
    { id: 'n1', title: 'GSTR-3B due', desc: 'GSTR-3B filing due for Acme Global', time: '2h', target: { type: 'task', id: 'TSK-5001' }, read: false },
    { id: 'n2', title: 'Employee Onboarded', desc: 'New employee Anita Mishra added', time: '1d', target: { type: 'employee', id: 'EMP-1103' }, read: false },
    { id: 'n3', title: 'Payment Received', desc: 'Invoice #INV-102 paid', time: '3d', target: { type: 'client', id: 'CL-2001' }, read: false },
  ]

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchValue(v)
    onInput(e)

    if (!v.trim()) {
      setResultsOpen(false)
      setSearchActive(false)
      return
    }
    setSearchActive(true)
    setResultsOpen(true)
  }

  const clearSearch = () => {
    setSearchValue('')
    setResultsOpen(false)
    setSearchActive(false)
    window.dispatchEvent(new CustomEvent('app:search', { detail: '' }))
    inputRef.current?.focus()
  }

  return (
    <>
    <header style={{ height: 'var(--topbar-height)' }} className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-canvas px-4 md:px-10">
        <div ref={searchRef} className="relative flex-1">
        <button onClick={() => onOpenSidebar && onOpenSidebar()} className="mr-3 md:hidden text-ink-soft">
          <Menu className="h-5 w-5" />
        </button>
        <button onClick={() => inputRef.current?.focus()} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
          <Search className="h-5 w-5" />
        </button>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchValue.trim()) {
              setResultsOpen(true)
              setSearchActive(true)
            }
          }}
          className="h-11 w-full rounded-lg border border-line bg-surface pl-12 pr-10 text-base text-ink placeholder:text-ink-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
            style={{ paddingTop: 10, paddingBottom: 10, fontSize: 15 }}
          ref={inputRef}
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search dropdown — shows guidance/no-results state */}
        {resultsOpen && searchActive && (
          <div className="absolute left-0 right-0 mt-2 z-50">
            <Card>
              <div className="p-3">
                <div className="flex items-center gap-2 text-xs text-ink-muted mb-2 pb-2 border-b border-line">
                  <Search className="h-3.5 w-3.5" />
                  <span>Results are filtered on the active page</span>
                </div>
                <div className="py-2 px-1 text-sm text-ink-soft">
                  Searching for <strong className="text-ink">"{searchValue}"</strong> — scroll down to see matching results on the current page.
                </div>
                <div className="mt-2 pt-2 border-t border-line flex gap-2">
                  {[
                    { label: 'Go to Employees', route: userRole === 'Team Lead' ? '/lead/employees' : '/employees' },
                    { label: 'Go to Tasks', route: userRole === 'Team Lead' ? '/lead/tasks' : '/tasks' },
                    { label: 'Go to Clients', route: userRole === 'Team Lead' ? '/lead/clients' : '/clients' },
                  ].map((link) => (
                    <button
                      key={link.route}
                      className="text-xs font-semibold px-2 py-1 rounded border border-line hover:bg-surface-muted transition-colors"
                      onClick={() => {
                        navigate(link.route)
                        setResultsOpen(false)
                      }}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <div className="ml-auto hidden md:flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((s) => !s)
              setHelpOpen(false)
              setSupportOpen(false)
            }}
            className="text-ink-soft transition-colors hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 z-50">
              <Card>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold">Notifications</div>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-ink-muted hover:text-ink transition-colors rounded p-0.5"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {sampleNotifications.length === 0 ? (
                      <div className="py-4 text-center text-sm text-ink-muted">No new notifications</div>
                    ) : (
                      sampleNotifications.map((n) => (
                        <div key={n.id} className={`rounded-md p-2 hover:bg-surface-muted flex justify-between ${n.read ? 'opacity-60' : ''}`}>
                          <div onClick={() => {
                            if (n.target) {
                              const isLead = window.location.pathname.startsWith('/lead') || userRole === 'Team Lead'
                              if (n.target.type === 'employee') navigate(isLead ? `/lead/employees/${n.target.id}` : `/employees/${n.target.id}`)
                              if (n.target.type === 'client') navigate(isLead ? `/lead/clients/${n.target.id}` : `/clients/${n.target.id}`)
                              if (n.target.type === 'task') navigate(isLead ? `/lead/tasks` : `/tasks/${n.target.id}`)
                            }
                            n.read = true
                            setNotifOpen(false)
                            toast({ type: 'info', message: 'Opened notification' })
                          }} style={{ cursor: 'pointer' }}>
                            <div className="text-sm font-bold">{n.title}</div>
                            <div className="text-xs text-ink-muted">{n.desc}</div>
                            <div className="text-xs text-ink-soft mt-1">{n.time}</div>
                          </div>
                          {!n.read ? <div className="text-xs text-amber" style={{ marginLeft: 8 }}>●</div> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Settings icon */}
        <div className="relative">
          <button
            onClick={() => {
              if (userRole === 'Team Lead') {
                navigate('/lead/settings')
              } else if (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Global Access') {
                navigate('/settings')
              }
            }}
            className="text-ink-soft hover:text-ink transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Help */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => {
              setHelpOpen((s) => !s)
              setNotifOpen(false)
              setSupportOpen(false)
            }}
            className="text-ink-soft transition-colors hover:text-ink"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          {helpOpen && (
            <div className="absolute right-0 mt-2 w-96 z-50">
              <Card>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="text-lg font-semibold">Help</div>
                    <button
                      onClick={() => setHelpOpen(false)}
                      className="text-ink-muted hover:text-ink transition-colors rounded p-0.5 -mt-0.5"
                      aria-label="Close help"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-ink-muted">No help page found. This is a placeholder.</div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <span className="h-6 w-px bg-line" />

        {/* Support */}
        <div className="relative" ref={supportRef}>
          <button
            onClick={() => {
              setSupportOpen((s) => !s)
              setNotifOpen(false)
              setHelpOpen(false)
            }}
            className="text-sm font-semibold text-gold-dark"
          >
            Support
          </button>
          {supportOpen && (
            <div className="absolute right-0 mt-2 w-80 z-50">
              <Card>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="text-lg font-semibold">Support</div>
                    <button
                      onClick={() => setSupportOpen(false)}
                      className="text-ink-muted hover:text-ink transition-colors rounded p-0.5 -mt-0.5"
                      aria-label="Close support"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="text-sm">Email: <span className="font-medium">support@complianceos.com</span></div>
                    <div className="text-sm">Contact: <span className="font-medium">+91 1800 123 456</span></div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <div onClick={() => setProfileOpen((s) => !s)} className="flex items-center gap-3 pl-1 cursor-pointer">
            <div className="text-right">
              <p className="text-sm font-bold leading-tight text-ink">{userName}</p>
              <p className="text-xs text-ink-muted">{userRole}</p>
            </div>
            <Avatar name={userName} size={38} className="ring-2 ring-amber/40" />
          </div>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-44 z-50">
              <Card>
                <div className="p-2">
                  {/* Profile */}
                  <button
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-surface-muted transition-colors"
                    onClick={() => {
                      setProfileOpen(false)
                      if (userRole === 'Team Lead') navigate('/lead/settings')
                      else alert('Profile placeholder')
                    }}
                  >
                    Profile
                  </button>
                  {/* Logout — Settings removed for Team Lead per requirements */}
                  <button
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-surface-muted transition-colors text-red-600"
                    onClick={() => {
                      setProfileOpen(false)
                      setConfirmOpen(true)
                    }}
                  >
                    Logout
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </header>
    <Toasts />
    <ConfirmModal
      open={confirmOpen}
      title="Logout"
      message="Are you sure you want to log out?"
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false)
        logout()
        toast({ type: 'success', message: 'You have been logged out' })
        navigate('/login')
      }}
    />
    </>
  )
}
