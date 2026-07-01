import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export default function CreateAccount() {
  return (
    <div className="min-h-screen bg-canvas px-4 py-6 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-xl p-6 sm:p-8 lg:p-10">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-ink">Create Account</h1>
          <p className="mt-2 text-sm text-ink-muted">Create an account to access the Admin Console.</p>
        </div>

        <div className="mt-6 space-y-4">
          <input maxLength={50} className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm" placeholder="Full name" />
          <input type="email" className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm" placeholder="Work email" />
          <input type="password" className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm" placeholder="Password" />
          <Button variant="primary" className="w-full justify-center">Create Account →</Button>
        </div>
      </Card>
    </div>
  )
}
