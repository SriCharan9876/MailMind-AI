import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { api } from "../api"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [userData, setUserData] = useState({ name: "User", email: "user@example.com" })

    // Determine title based on current path
    const getTitle = (pathname: string) => {
        switch (pathname) {
            case "/chat": return "Chat"
            case "/settings": return "Settings"
            case "/dashboard": return "Dashboard"
            default: return "Dashboard"
        }
    }

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
                    window.history.replaceState({}, document.title, location.pathname)
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
    }, [navigate, location.pathname])

    const handleSignOut = () => {
        localStorage.removeItem("session_id")
        navigate("/")
    }

    return (
        <div className="flex h-screen w-full bg-slate-950 text-white overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
            {/* Sidebar */}
            <Sidebar onSignOut={handleSignOut} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                <Navbar title={getTitle(location.pathname)} user={userData} />

                <main className="flex-1 p-4 min-h-0 overflow-hidden flex flex-col">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
