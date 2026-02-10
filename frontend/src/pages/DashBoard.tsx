import { useState, useEffect } from "react"
import { api } from "../api"
import { ChevronLeft, ChevronRight, Loader2, Sparkles, FileText, LayoutList, MessageSquare, Copy, Check, Eye, Trash2, X, Send, CornerUpLeft } from "lucide-react"
import DOMPurify from 'dompurify'

interface DraftEmail {
    to: string
    subject: string
    body: string
}

interface Email {
    id: string
    subject: string
    from: string
    snippet: string
    body: string
    summary?: string
    suggestedReplies?: string[]
}

type ViewMode = 'preview' | 'ai_preview' | 'ai_summary'
type ReplyCount = 0 | 1 | 2 | 3

export default function Dashboard() {
    const [emails, setEmails] = useState<Email[]>([])
    const [loading, setLoading] = useState(false)
    const [limit, setLimit] = useState(5)
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)
    const [pageTokens, setPageTokens] = useState<string[]>([]) // Stack of tokens for "Previous"
    const [currentPage, setCurrentPage] = useState(0)
    const [viewMode, setViewMode] = useState<ViewMode>('preview')
    const [summarizing, setSummarizing] = useState(false)
    const [replyCount, setReplyCount] = useState<ReplyCount>(0)
    const [generatingReplies, setGeneratingReplies] = useState(false)


    // Action States
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
    const [emailToDelete, setEmailToDelete] = useState<Email | null>(null)
    const [draftEmail, setDraftEmail] = useState<DraftEmail | null>(null)
    const [sending, setSending] = useState(false)

    const fetchEmails = async (token: string | null = null) => {
        setLoading(true)
        setViewMode('preview')
        setReplyCount(0) // Reset options on page change
        try {
            const sessionId = localStorage.getItem("session_id")
            if (!sessionId) return

            const res = await api.get("/emails", {
                params: {
                    session_id: sessionId,
                    limit: limit,
                    page_token: token
                }
            })
            setEmails(res.data.emails)
            setNextPageToken(res.data.nextPageToken)
        } catch (err) {
            console.error("Failed to fetch emails", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchSummaries = async (currentEmails: Email[]) => {
        const emailsToSummarize = currentEmails.filter(e => !e.summary)
        if (emailsToSummarize.length === 0) return

        setSummarizing(true)
        try {
            const texts = emailsToSummarize.map(e => e.body)
            const res = await api.post("/ai/summarize", { texts })

            const newSummaries = res.data.summaries

            setEmails(prev => prev.map(e => {
                const idx = emailsToSummarize.findIndex(toSum => toSum.id === e.id)
                if (idx !== -1) {
                    return { ...e, summary: newSummaries[idx] }
                }
                return e
            }))
        } catch (err) {
            console.error("Failed to fetch summaries", err)
        } finally {
            setSummarizing(false)
        }
    }

    const fetchReplies = async (currentEmails: Email[], count: number) => {
        // Filter emails that don't have enough replies
        const emailsToGen = currentEmails.filter(e => !e.suggestedReplies || e.suggestedReplies.length < count)
        if (emailsToGen.length === 0) return

        setGeneratingReplies(true)
        try {
            // We request 'count' replies for each email.
            // Optimally we only need (count - existing), but batching same count is easier.
            const texts = emailsToGen.map(e => e.body)
            const res = await api.post("/ai/replies", { texts, count })

            const newRepliesBatch = res.data.replies // Array of string arrays

            setEmails(prev => prev.map(e => {
                const idx = emailsToGen.findIndex(toGen => toGen.id === e.id)
                if (idx !== -1) {
                    return { ...e, suggestedReplies: newRepliesBatch[idx] }
                }
                return e
            }))
        } catch (err) {
            console.error("Failed to generate replies", err)
        } finally {
            setGeneratingReplies(false)
        }
    }

    const handleDelete = async () => {
        if (!emailToDelete) return

        try {
            const sessionId = localStorage.getItem("session_id")
            await api.delete(`/emails/${emailToDelete.id}`, {
                params: { session_id: sessionId }
            })

            // Remove from local state
            setEmails(prev => prev.filter(e => e.id !== emailToDelete.id))
            setEmailToDelete(null)
        } catch (err) {
            console.error("Failed to delete email", err)
            alert("Failed to delete email")
        }
    }

    useEffect(() => {
        if (viewMode !== 'preview' && emails.length > 0) {
            fetchSummaries(emails)
        }
    }, [viewMode, emails])

    useEffect(() => {
        if (replyCount > 0 && emails.length > 0) {
            fetchReplies(emails, replyCount)
        }
    }, [replyCount, emails])

    const handleSendLegacy = async (draft: DraftEmail) => {
        setSending(true)
        try {
            const sessionId = localStorage.getItem("session_id")
            await api.post("/emails/send", {
                session_id: sessionId,
                to: draft.to,
                subject: draft.subject,
                body: draft.body
            })
            alert("Email sent successfully!")
            setDraftEmail(null)
        } catch (err) {
            console.error("Failed to send email", err)
            alert("Failed to send email.")
        } finally {
            setSending(false)
        }
    }

    const openCompose = (email: Email, replyText: string) => {
        setDraftEmail({
            to: email.from.match(/<(.+)>/)?.[1] || email.from, // Extract email from "Name <email>"
            subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
            body: replyText
        })
    }

    // Initial fetch
    useEffect(() => {
        setPageTokens([])
        setCurrentPage(0)
        fetchEmails(null)
    }, [limit])

    const handleNext = () => {
        if (!nextPageToken) return

        // If we are at the end of our history, append
        if (currentPage === pageTokens.length) {
            setPageTokens([...pageTokens, nextPageToken])
        }

        setCurrentPage(p => p + 1)
        fetchEmails(nextPageToken)
    }

    const handlePrev = () => {
        if (currentPage > 0) {
            const prevPage = currentPage - 1
            setCurrentPage(prevPage)

            const tokenToUse = prevPage === 0 ? null : pageTokens[prevPage - 1]
            fetchEmails(tokenToUse)
        }
    }



    const getEmailContent = (email: Email) => {
        if (loading) return null

        let content = null
        if (viewMode === 'preview') {
            content = (
                <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                    {email.snippet}
                </p>
            )
        } else if (summarizing && !email.summary) {
            content = (
                <div className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse mb-3">
                    <Sparkles size={14} />
                    <span>Generating AI summary...</span>
                </div>
            )
        } else {
            const summaryText = email.summary || "Summary unavailable."
            if (viewMode === 'ai_preview') {
                content = (
                    <div className="relative mb-3">
                        <p className={`text-xs line-clamp-3 ${summaryText.startsWith("AI Error") ? "text-red-400 italic" : "text-indigo-200"}`}>
                            <span className={`font-semibold mr-2 ${summaryText.startsWith("AI Error") ? "text-red-400 italic" : "text-indigo-400"}`}>AI Summary:</span>
                            {summaryText.startsWith("AI Error") ? "AI Rate Limit Error" : summaryText}
                        </p>
                    </div>
                )
            } else {
                content = (
                    <div className="mt-2 bg-indigo-950/30 p-3 rounded-lg border border-indigo-500/20 mb-3">
                        <div className={`flex items-center gap-2 mb-1  ${summaryText.startsWith("AI Error") ? "text-red-400 italic" : "text-indigo-400"}`}>
                            <Sparkles size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">AI Summary</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${summaryText.startsWith("AI Error") ? "text-red-400 italic" : "text-slate-200"}`}>
                            {summaryText.startsWith("AI Error") ? "AI Rate Limit Error" : summaryText}
                        </p>
                    </div>
                )
            }
        }

        // Suggested Replies Section
        if (replyCount > 0) {
            return (
                <div className="flex flex-col gap-3">
                    {content}

                    <div className="border-t border-slate-800 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare size={14} className="text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Suggested Replies</span>
                            {generatingReplies && !email.suggestedReplies && <Loader2 size={12} className="animate-spin text-emerald-500" />}
                        </div>

                        <div className="grid gap-2">
                            {email.suggestedReplies?.slice(0, replyCount).map((reply, idx) => {
                                const isError = reply.startsWith("AI ERROR") || reply.startsWith("Error:") || reply.startsWith("AI Error")
                                return (
                                    <div
                                        key={idx}
                                        className={`group/reply border p-3 rounded-lg transition-all relative flex flex-col gap-2 ${isError
                                            ? "bg-red-950/20 border-red-500/30 hover:border-red-500/50"
                                            : "bg-emerald-950/20 hover:bg-emerald-900/30 border-emerald-500/20 hover:border-emerald-500/40"
                                            }`}
                                    >
                                        <p className={`text-xs leading-relaxed line-clamp-3 ${isError ? "text-red-400 italic" : "text-emerald-100/90"}`}>
                                            {isError ? "AI Rate Limit Error" : reply}
                                        </p>

                                        {!isError && (
                                            <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openCompose(email, reply)}
                                                    className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                                    title="Reply with this text"
                                                >
                                                    <CornerUpLeft size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            {(!email.suggestedReplies || email.suggestedReplies.length === 0) && !generatingReplies && (
                                <div className="text-xs text-slate-600 italic">No suggestions generated yet.</div>
                            )}
                            {generatingReplies && (!email.suggestedReplies || email.suggestedReplies.length < replyCount) && (
                                <div className="text-xs text-emerald-500/50 italic animate-pulse">Thinking...</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        return content
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* View Reply Modal */}


            {/* Compose Modal */}
            {draftEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                <Send size={18} className="text-blue-400" />
                                Compose Reply
                            </h3>
                            <button onClick={() => setDraftEmail(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">To</label>
                                <input
                                    type="text"
                                    value={draftEmail.to}
                                    onChange={e => setDraftEmail({ ...draftEmail, to: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={draftEmail.subject}
                                    onChange={e => setDraftEmail({ ...draftEmail, subject: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Body</label>
                                <textarea
                                    value={draftEmail.body}
                                    onChange={e => setDraftEmail({ ...draftEmail, body: e.target.value })}
                                    className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors resize-none font-sans leading-relaxed"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setDraftEmail(null)}
                                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSendLegacy(draftEmail)}
                                disabled={sending}
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {sending ? "Sending..." : "Send Reply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">{selectedEmail.subject}</h2>
                                <p className="text-xs text-slate-400 mt-1">{selectedEmail.from}</p>
                            </div>
                            <button onClick={() => setSelectedEmail(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full text-slate-300 leading-relaxed font-sans prose prose-invert prose-sm max-w-none text-xs">
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body) }} />
                        </div>
                    </div>
                </div>
            )}

            {emailToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-red-500/30 w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-100 mb-2">Delete Email?</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            Are you sure you want to delete <span className="text-slate-200 font-semibold">{emailToDelete.subject}</span>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setEmailToDelete(null)}
                                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Header */}
            <div className="p-6 pb-2 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Your Emails
                    </h1>
                    <p className="text-slate-400 text-sm">Manage your inbox efficiently.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Replies Toggle */}
                    <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                        <span className="text-xs font-semibold text-emerald-500/80 px-2 uppercase tracking-tight">Suggested Replies:</span>
                        {[0, 1, 2, 3].map(count => (
                            <button
                                key={count}
                                onClick={() => setReplyCount(count as ReplyCount)}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${replyCount === count
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                                    : 'text-slate-500 hover:text-emerald-300 hover:bg-slate-800'
                                    }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'preview'
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            <LayoutList size={16} />
                            Preview
                        </button>
                        <button
                            onClick={() => setViewMode('ai_preview')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'ai_preview'
                                ? 'bg-indigo-600/80 text-white shadow-sm shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                                }`}
                        >
                            <FileText size={16} />
                            AI Preview
                        </button>
                        <button
                            onClick={() => setViewMode('ai_summary')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'ai_summary'
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                                }`}
                        >
                            <Sparkles size={16} />
                            AI Summary
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {emails.map((email) => (
                            <div
                                key={email.id}
                                className={`group relative bg-slate-900/50 hover:bg-slate-800/50 border rounded-xl p-5 transition-all duration-300 shadow-lg hover:shadow-blue-500/10 flex flex-col gap-1
                                    ${viewMode !== 'preview' ? 'border-indigo-500/20 hover:border-indigo-500/40' : 'border-slate-800 hover:border-blue-500/50'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col gap-1 overflow-hidden w-full pr-2">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest leading-none">
                                            {email.from.split("<")[0].trim()}
                                        </span>
                                        <h3 className="font-semibold text-slate-200 text-base truncate leading-tight">
                                            {email.subject}
                                        </h3>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 rounded-lg p-1 border border-slate-700/50 shadow-sm shrink-0">
                                        <button
                                            onClick={() => setSelectedEmail(email)}
                                            className="p-1.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-md transition-colors"
                                            title="View Full Content"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-700"></div>
                                        <button
                                            onClick={() => setEmailToDelete(email)}
                                            className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                                            title="Delete Email"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {getEmailContent(email)}

                            </div>
                        ))}

                        {emails.length === 0 && !loading && (
                            <div className="text-center py-20 text-slate-500">
                                No emails found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls... (Use existing) */}
            <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-slate-900/90 backdrop-blur-md p-2 rounded-full border border-slate-800 shadow-2xl z-10">
                <div className="flex items-center gap-2 pl-4 border-r border-slate-700 pr-4">
                    <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Per Page</span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className=" border-none bg-transparent text-sm font-bold text-blue-400 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                        <option value={5} className="bg-slate-900 text-blue-400">5</option>
                        <option value={10} className="bg-slate-900 text-blue-400">10</option>
                        <option value={20} className="bg-slate-900 text-blue-400">20</option>
                    </select>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 0 || loading}
                        className="p-2 hover:bg-slate-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
                        title="Previous Page"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-mono text-slate-400 w-12 text-center">
                        Pg {currentPage + 1}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={!nextPageToken || loading}
                        className="p-2 hover:bg-slate-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
                        title="Next Page"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}

