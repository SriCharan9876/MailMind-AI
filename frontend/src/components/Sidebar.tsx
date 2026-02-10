import { MessageSquare, LayoutDashboard, Settings, LogOut, Mail } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

interface SidebarProps {
    onSignOut: () => void
}

export default function Sidebar({ onSignOut }: SidebarProps) {
    const navigate = useNavigate()
    const location = useLocation()

    // Determine active path to highlight the correct button
    // We can default to checking if pathname includes the key
    const isActive = (path: string) => location.pathname === path

    return (
        <div className="w-60 border-r border-white/10 p-3 flex flex-col bg-slate-950/50 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-2 py-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-500/20">
                    <Mail className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-base tracking-tight">Gmail<span className="text-blue-400">AI</span></span>
            </div>

            <nav className="flex-1 space-y-1">
                <button onClick={() => navigate("/chat")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive("/chat") ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium text-sm">Chat</span>
                </button>

                <button onClick={() => navigate("/dashboard")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive("/dashboard") ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="font-medium text-sm">Dashboard</span>
                </button>

                <button onClick={() => navigate("/settings")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive("/settings") ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
                    <Settings className="h-4 w-4" />
                    <span className="font-medium text-sm">Settings</span>
                </button>
            </nav>

            <div className="pt-3 border-t border-white/10">
                <button onClick={onSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group">
                    <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </div>
    )
}
