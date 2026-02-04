import { useState, useEffect } from "react"
import ChatBox from "../components/ChatBox"
import { MessageSquare, Settings, LogOut, User, Mail } from "lucide-react"

export default function Dashboard() {
  useEffect(() => {
    const token = window.location.hash.split("access_token=")[1]?.split("&")[0]
    if (token) {
      localStorage.setItem("token", token)
      window.location.hash = ""
    }
  }, [])

  const [activeTab, setActiveTab] = useState("chat")

  return (
    <div className="flex h-screen w-full bg-slate-950 text-white overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-4 flex flex-col bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-500/20">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Gmail<span className="text-blue-400">AI</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "chat" ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "settings" ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group">
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-sm z-10">
          <h2 className="text-lg font-semibold text-white capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">User</p>
                <p className="text-xs text-slate-400">user@example.com</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col p-4 relative z-0">
          {activeTab === "chat" ? (
            <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
              <ChatBox />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 glass-card rounded-2xl">
              <div className="text-center">
                <Settings className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Settings panel coming soon</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
