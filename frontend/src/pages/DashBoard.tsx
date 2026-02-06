import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"
import ChatBox from "../components/ChatBox"
import { MessageSquare, Settings, LogOut, User, Mail } from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("chat")
  const [userData, setUserData] = useState({ name: "User", email: "user@example.com" })

  useEffect(() => {
    const checkAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")   // 🔥 get authorization code
      let sessionId = localStorage.getItem("session_id")

      console.log("OAuth code:", code)
      console.log("Stored session:", sessionId)

      // 🔁 Exchange code for session
      if (code) {
        try {
          const res = await api.post("/auth/google", { code })
          sessionId = res.data.session_id
          if (sessionId) localStorage.setItem("session_id", sessionId)

          // Clean URL (remove ?code=)
          window.history.replaceState({}, document.title, "/dashboard")
        } catch (err) {
          console.error("Auth exchange failed", err)
          navigate("/")
          return
        }
      }

      // ❌ No session → back to login
      if (!sessionId) {
        navigate("/")
        return
      }

      // 👤 Fetch logged-in user
      try {
        const res = await api.post("/auth/me", { session_id: sessionId })
        setUserData(res.data)
      } catch (err) {
        console.error("Session invalid", err)
        localStorage.removeItem("session_id")
        navigate("/")
      }
    }

    checkAuth()
  }, [navigate])

  const handleSignOut = () => {
    localStorage.removeItem("session_id")
    navigate("/")
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-white overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
      {/* Sidebar */}
      <div className="w-60 border-r border-white/10 p-3 flex flex-col bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-500/20">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">Gmail<span className="text-blue-400">AI</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === "chat" ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium text-sm">Chat</span>
          </button>

          <button onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === "settings" ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <Settings className="h-4 w-4" />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </nav>

        <div className="pt-3 border-t border-white/10">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group">
            <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-sm z-10">
          <h2 className="text-base font-semibold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{userData.name}</p>
                <p className="text-xs text-slate-400">{userData.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 min-h-0 overflow-hidden flex flex-col">
          {activeTab === "chat"
            ? <ChatBox />
            : <div className="flex-1 flex items-center justify-center text-slate-500">Settings coming soon</div>}
        </main>
      </div>
    </div>
  )
}
