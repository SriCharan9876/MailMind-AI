import { User } from "lucide-react"

interface NavbarProps {
    title: string
    user: {
        name: string
        email: string
    }
}

export default function Navbar({ title, user }: NavbarProps) {
    return (
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-sm z-10">
            <h2 className="text-base font-semibold capitalize">{title}</h2>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-400" />
                    </div>
                </div>
            </div>
        </header>
    )
}
