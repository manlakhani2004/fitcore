"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  MessageSquare, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  User as UserIcon, 
  ExternalLink,
  Sparkles,
  Users
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

function formatImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const backendBase = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:5000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

function InboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get('user');
  const currentUser = useAuthStore((state) => state.user);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const fetchConversations = async (preferredUserId?: string) => {
    try {
      const res = await api.get('/users/conversations');
      let list = res.data?.data || [];

      // If user came via ?user=<id>, ensure that target user is loaded
      if (preferredUserId) {
        const found = list.find((c: any) => c.user?._id === preferredUserId);
        if (!found) {
          // Fetch target user profile to create a virtual conversation tab
          try {
            const userRes = await api.get(`/community/users/${preferredUserId}/profile`);
            if (userRes.data?.success && userRes.data.data?.user) {
              const u = userRes.data.data.user;
              const newConv = {
                user: {
                  _id: u._id,
                  name: u.name,
                  email: u.email,
                  avatar: u.avatar,
                  role: u.role,
                  bio: u.bio || ''
                },
                lastMessage: 'Tap to start conversation',
                lastMessageAt: new Date(),
                unreadCount: 0,
                isCoach: u.role === 'coach'
              };
              list = [newConv, ...list];
            }
          } catch (e) {
            console.error('Failed to load target profile for conversation', e);
          }
        }
      }

      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      return [];
    }
  };

  // Load chat messages with a specific partner
  const loadMessagesWithPartner = async (partnerId: string, showSpinner = true) => {
    if (!partnerId) return;
    if (showSpinner) setLoadingMessages(true);
    try {
      const res = await api.get(`/users/my-messages?user=${partnerId}`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
        if (res.data.targetUser) {
          setActivePartner(res.data.targetUser);
        }
      }
    } catch (err) {
      console.error('Failed to load messages with partner:', err);
    } finally {
      if (showSpinner) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    let isMounted = true;

    const initializeInbox = async () => {
      setLoading(true);
      const convList = await fetchConversations(queryUserId || undefined);
      
      const targetId = queryUserId || (convList.length > 0 ? convList[0].user?._id : null);
      if (targetId && isMounted) {
        await loadMessagesWithPartner(targetId, false);
      }
      if (isMounted) setLoading(false);
    };

    initializeInbox();

    return () => {
      isMounted = false;
    };
  }, [queryUserId]);

  // Periodic polling for active conversation
  useEffect(() => {
    if (!activePartner?._id) return;
    const interval = setInterval(() => {
      loadMessagesWithPartner(activePartner._id, false);
    }, 4000);
    return () => clearInterval(interval);
  }, [activePartner?._id]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select conversation
  const handleSelectPartner = (partner: any) => {
    setActivePartner(partner);
    router.push(`/member/inbox?user=${partner._id}`);
    loadMessagesWithPartner(partner._id, true);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !activePartner?._id) return;

    const contentToSend = input.trim();
    setSending(true);

    try {
      const res = await api.post('/users/my-messages', {
        content: contentToSend,
        receiverId: activePartner._id
      });

      if (res.data.success) {
        const newMsg = res.data.data;
        setMessages(prev => [...prev, newMsg]);
        setInput("");

        // Update local conversation snippet
        setConversations(prev => 
          prev.map(c => {
            if (c.user?._id === activePartner._id) {
              return {
                ...c,
                lastMessage: contentToSend,
                lastMessageAt: new Date()
              };
            }
            return c;
          })
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-text-muted">Loading messages & conversations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-text-primary">
          Messages & Chat
        </h1>
        <p className="text-xs md:text-sm text-text-muted mt-1">
          Direct messaging with your coaches, mentors, and fellow athletes.
        </p>
      </div>

      {/* Main Chat Hub Container */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[75vh] min-h-[550px]">
        {/* Left Sidebar: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border flex flex-col bg-background/50 ${
          activePartner ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-xs text-text-muted uppercase tracking-wider">
              Conversations ({conversations.length})
            </span>
            <Link
              href="/member/community"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Find Athletes</span>
            </Link>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {conversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-text-muted mx-auto opacity-40" />
                <p className="text-xs text-text-muted">No active conversations yet.</p>
                <Link
                  href="/member/community"
                  className="inline-block text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  Explore Community
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activePartner?._id === conv.user?._id;
                const partnerName = conv.user?.name || "FitCore Member";
                const initial = partnerName.charAt(0).toUpperCase() || "A";

                return (
                  <button
                    key={conv.user?._id}
                    type="button"
                    onClick={() => handleSelectPartner(conv.user)}
                    className={`w-full p-4 flex items-start gap-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-500/10 dark:bg-indigo-500/15 border-l-4 border-indigo-600"
                        : "hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs mt-0.5">
                      {conv.user?.avatar ? (
                        <img 
                          src={formatImageUrl(conv.user.avatar)} 
                          alt={partnerName} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-sm text-text-primary truncate">
                          {partnerName}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-text-muted shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        {conv.user?.role === 'coach' && (
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded uppercase">
                            Coach
                          </span>
                        )}
                        {conv.user?.role === 'admin' && (
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1 rounded uppercase">
                            HQ Admin
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-muted truncate">
                        {conv.lastMessage || "Tap to chat..."}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Thread */}
        <div className={`flex-1 flex flex-col bg-surface ${
          !activePartner ? 'hidden md:flex' : 'flex'
        }`}>
          {activePartner ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface/80 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setActivePartner(null)}
                    className="md:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                    {activePartner.avatar ? (
                      <img 
                        src={formatImageUrl(activePartner.avatar)} 
                        alt={activePartner.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{activePartner.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                    )}
                  </div>

                  {/* Partner Name & Badges */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm sm:text-base text-text-primary truncate">
                        {activePartner.name}
                      </h2>
                      {activePartner.role === 'coach' && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          Coach
                        </span>
                      )}
                      {activePartner.role === 'admin' && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded uppercase">
                          HQ
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Direct Message
                    </span>
                  </div>
                </div>

                {/* View Profile Link */}
                <Link
                  href={`/member/community/profile/${activePartner._id}`}
                  className="text-xs font-semibold text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-xl border border-border hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Profile</span>
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                </Link>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-background/30">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-text-muted space-y-3 p-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-text-primary">
                        Start of your chat with {activePartner.name}
                      </p>
                      <p className="text-xs max-w-sm">
                        Discuss workout routines, exchange progressive overload tips, or ask training questions!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.senderId === currentUser?._id || msg.senderId === currentUser?.id;
                    return (
                      <motion.div
                        key={msg._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2.5 ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine && (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden mt-1 shadow-xs">
                            {activePartner.avatar ? (
                              <img 
                                src={formatImageUrl(activePartner.avatar)} 
                                alt={activePartner.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span>{activePartner.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                            )}
                          </div>
                        )}

                        <div className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs ${
                          isMine
                            ? "bg-indigo-600 text-white rounded-br-xs"
                            : "bg-surface border border-border text-text-primary rounded-bl-xs"
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${
                            isMine ? "text-white/70" : "text-text-muted"
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-border bg-surface flex gap-2.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${activePartner.name}...`}
                  className="flex-1 bg-background border border-border rounded-2xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-text-primary placeholder:text-text-muted shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 rounded-2xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">No Conversation Selected</h2>
              <p className="text-xs max-w-sm">
                Select an athlete from the list on the left, or visit an athlete&apos;s profile and click &quot;Message&quot; to begin a conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemberInboxPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[70vh] items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-text-muted">Loading messages...</p>
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}
