import { Mail } from "lucide-react"

export default function Login() {
  const login = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirect = window.location.origin + "/dashboard"
    const scope = "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}&access_type=offline&prompt=consent`
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

      <div className="relative z-10 w-full max-w-md p-8 glass-card rounded-2xl flex flex-col items-center">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-500/30">
          <Mail className="h-8 w-8 text-white" />
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
          Gmail Assistant
        </h1>
        <p className="mb-8 text-center text-slate-400">
          AI-powered email management for your peace of mind.
        </p>

        <button
          className="w-full btn-primary flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-lg group"
          onClick={login}
        >
          <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </div>
  )
}
