import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowRight, Eye, EyeOff, Lock, Mail, Check } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

function TraxaLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Stylized geometric Traxa logo mark matching screenshot */}
      <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dark Grey chevron (resembles a 7 or upper part of T) */}
        <path d="M15 22 L75 22 L45 80 L23 80 L50 34 L15 34 Z" fill={light ? "#FFFFFF" : "#1E2022"} />
        {/* Vibrant Orange chevron overlapping */}
        <path d="M40 22 L90 22 L60 80 L38 80 L65 34 L40 34 Z" fill="#F96A02" />
      </svg>
      <div className="flex flex-col select-none">
        <span className={`text-2xl font-black tracking-wider leading-none ${light ? "text-white" : "text-gray-900"}`}>
          TRAXA
        </span>
        <span className={`text-[7.5px] font-bold tracking-[0.22em] mt-1 leading-none ${light ? "text-orange-200" : "text-gray-500"}`}>
          MANAGE • TRACK • ACHIEVE
        </span>
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const loggedInUser = await login({ email, password })
      let dest = from
      if (from === "/dashboard" || from === "/" || from === "/login") {
        dest = loggedInUser.role === "Team Lead" ? "/lead" : "/dashboard"
      }
      navigate(dest, { replace: true })
    } catch (err: unknown) {
      let errMsg = err instanceof Error ? err.message : "Login failed"
      if (errMsg === "Invalid credentials" || errMsg.toLowerCase().includes("credentials")) {
        errMsg = "wrong password or incorrect email id"
      }
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Left Column - Brand Showcase (Hidden on Mobile) */}
      <div 
        className="hidden md:flex md:w-[50%] lg:w-[55%] flex-col justify-between p-12 lg:p-16 text-white relative overflow-hidden"
        style={{
          background: "radial-gradient(circle at 10% 20%, rgba(255, 120, 0, 0.92) 0%, rgba(249, 106, 2, 1) 90%)"
        }}
      >
        {/* Subtle decorative mesh grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px, 40px 40px, 40px 40px'
          }}
        />

        {/* Top Header - Logo */}
        <div className="relative z-10">
          <TraxaLogo light />
        </div>

        {/* Center Content */}
        <div className="my-auto space-y-6 relative z-10 max-w-lg">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Manage. Track. Achieve.
          </h2>
          <p className="text-lg lg:text-xl text-orange-50 font-medium leading-relaxed">
            Empower your team with the tools to collaborate, scale, and succeed together.
          </p>
        </div>

        {/* Bottom Feature Checks */}
        <div className="relative z-10 flex flex-wrap gap-x-8 gap-y-3 text-xs font-bold tracking-wider text-orange-100 uppercase">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
            Seamless Collaboration
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
            Real-Time Tracking
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
            Team Insights
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col justify-between px-6 py-12 sm:px-12 md:px-16 lg:px-20 bg-white">
        {/* Top Spacer or Small Logo for mobile view */}
        <div className="md:hidden flex justify-start mb-8">
          <TraxaLogo />
        </div>
        <div className="hidden md:block"></div>

        {/* Form Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
              Welcome to Traxa
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
              Get started with your credentials
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F96A02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96A02]/10 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <a 
                  href="#forgot" 
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Please contact your administrator to reset your password.");
                  }}
                  className="text-xs font-bold text-[#F96A02] hover:text-[#d35400] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F96A02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96A02]/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-center text-sm font-semibold text-red-500 animate-shake">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F96A02] hover:bg-[#d35400] text-sm font-bold text-white transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-60"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
              {!loading && <ArrowRight className="h-4 w-4 stroke-[2.5]" />}
            </button>
          </form>

          {/* Sign up prompt */}
          <p className="text-center text-sm text-gray-500 font-medium">
            Don't have an account?{" "}
            <a 
              href="#signup" 
              onClick={(e) => {
                e.preventDefault();
                alert("Sign-up is restricted to system administrators. Please contact support.");
              }}
              className="font-bold text-[#F96A02] hover:text-[#d35400] transition-colors"
            >
              Sign up for free
            </a>
          </p>
        </div>

        {/* Bottom Bar: statutory links & partner box */}
        <div className="w-full space-y-6 mt-8">
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
            <a href="#privacy" className="hover:text-gray-600">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-gray-600">Terms of Service</a>
          </div>

          {/* Become Traxa Partner Box */}
          <div 
            onClick={() => alert("Thank you for your interest! Traxa Partner portal onboarding is coming soon.")}
            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100/80 border border-gray-100 cursor-pointer transition-all group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 leading-none">
                Ready to scale?
              </span>
              <p className="text-sm font-extrabold text-gray-800 leading-none">
                Become Traxa Partner
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-800 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  )
}
