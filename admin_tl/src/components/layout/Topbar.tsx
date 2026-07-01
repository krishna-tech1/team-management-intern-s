import { Search, Menu, X } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { Avatar } from "@/components/ui/Avatar"
import { Card } from "@/components/ui/Card"
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

  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const [searchActive, setSearchActive] = useState(false)

  const profileRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement | null>(null)

  // Outside-click handler — closes any open panel when clicking outside it
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (profileOpen && profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false)
      if (resultsOpen && searchRef.current && !searchRef.current.contains(t)) {
        setResultsOpen(false)
        setSearchActive(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [profileOpen, resultsOpen])

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
                  <span>Module search for the active workspace</span>
                </div>
                <div className="py-2 px-1 text-sm text-ink-soft">
                  Searching for <strong className="text-ink">"{searchValue}"</strong> — browse the relevant module page to review matching records.
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
                  {/* Logout */}
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
