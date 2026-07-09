import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { authService } from "@/services/authService"
import { Lock, Eye, EyeOff, Check, X, ShieldAlert, ArrowRight, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/Toast"

export default function ChangePassword() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if they don't need to change password
  useEffect(() => {
    if (user && !user.mustChangePassword) {
      const dest = user.role === "Team Lead" ? "/lead" : "/dashboard"
      navigate(dest, { replace: true })
    }
  }, [user, navigate])

  // Password requirements checklist
  const criteria = {
    length: newPassword.length >= 12,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[@#$%^&*!]/.test(newPassword),
  }

  const allMet = Object.values(criteria).every(Boolean)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!allMet) {
      setError("Please meet all password strength requirements.")
      return
    }

    if (!passwordsMatch) {
      setError("New password and confirm password do not match.")
      return
    }

    setLoading(true)
    try {
      await authService.changePassword({ oldPassword, newPassword })
      
      // Update local storage and auth context state
      const STORAGE_KEY = 'teamlead_session'
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.mustChangePassword = false
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      }
      
      toast({ message: "Password updated successfully!", type: "success" })
      
      // Force reload page to pick up updated context/storage state
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to change password. Make sure current password is correct.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 font-sans items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-1">
        <div className="p-8 sm:p-10 space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-500">
              Security Protocol Required
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
              Update Your Password
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              You are logging in with a temporary password. You must update your password before you can access the dashboard.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm font-semibold">
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Old Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Current Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F96A02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96A02]/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showOld ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                New Secure Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 12 characters"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F96A02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96A02]/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F96A02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96A02]/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Requirements Checklist Card */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Password Strength Checklist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  {criteria.length ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                      <X className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className={criteria.length ? "text-gray-700" : "text-gray-400"}>12+ Characters</span>
                </div>

                <div className="flex items-center gap-2">
                  {criteria.uppercase ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                      <X className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className={criteria.uppercase ? "text-gray-700" : "text-gray-400"}>Uppercase (A-Z)</span>
                </div>

                <div className="flex items-center gap-2">
                  {criteria.lowercase ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                      <X className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className={criteria.lowercase ? "text-gray-700" : "text-gray-400"}>Lowercase (a-z)</span>
                </div>

                <div className="flex items-center gap-2">
                  {criteria.number ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                      <X className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className={criteria.number ? "text-gray-700" : "text-gray-400"}>Number (0-9)</span>
                </div>

                <div className="flex items-center gap-2">
                  {criteria.special ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                      <X className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className={criteria.special ? "text-gray-700" : "text-gray-400"}>Special Char (@#$%^&*!)</span>
                </div>

                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 mt-1 pt-2 border-t border-gray-100">
                  {passwordsMatch ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                      <X className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className={passwordsMatch ? "text-gray-700" : "text-gray-400"}>Passwords Match</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !allMet || !passwordsMatch}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F96A02] hover:bg-[#d35400] text-sm font-bold text-white transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  UPDATING PASSWORD...
                </>
              ) : (
                <>
                  CONFIRM & UPDATE
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
