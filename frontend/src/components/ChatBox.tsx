import { useState, useEffect, useRef } from "react"
import { api } from "../api"
import { Send, Bot, User, Loader2 } from "lucide-react"

export default function ChatBox() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setMessages([
      { role: "bot", text: "👋 Hi! I can read, summarize, reply to, and delete your emails." }
    ])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const send = async (msg: string) => {
    if (!msg.trim()) return

    setMessages(m => [...m, { role: "user", text: msg }])
    setInput("")
    setLoading(true)

    try {
      const res = await api.post("/chat", {
        message: msg,
        token: localStorage.getItem("token")
      })
      setMessages(m => [...m, { role: "bot", text: res.data.reply }])
    } catch (error) {
      setMessages(m => [...m, { role: "bot", text: "❌ Sorry, something went wrong. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm">
      {/* Messages Area */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-700 text-slate-300"}`}>
              {m.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${m.role === "user"
                ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10"
                : "bg-slate-800 text-slate-200 rounded-bl-none shadow-md"
              }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
              <Bot size={20} />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Processing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-slate-950/30 backdrop-blur-md">
        <div className="glass-input rounded-xl p-2 pl-4 pr-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all shadow-lg inner-glow">
          <input
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 py-2"
            placeholder="Ask anything about your emails..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg active:scale-95 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-slate-600">AI can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  )
}
