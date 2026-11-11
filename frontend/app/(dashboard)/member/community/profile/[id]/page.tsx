"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Dumbbell, 
  Activity, 
  Users, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Sparkles, 
  Loader2, 
  MessageCircle, 
  Send, 
  Copy, 
  Flame, 
  ShieldCheck,
  Edit3
} from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
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

export default function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const athleteId = resolvedParams.id;
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/community/users/${athleteId}/profile`);
      if (res.data.success) {
        setProfileData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load athlete profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (athleteId) {
      fetchProfile();
    }
  }, [athleteId]);

  const handleToggleFollow = async () => {
    if (!profileData?.user?._id || profileData.user.isSelf) return;
    setIsFollowLoading(true);
    try {
      const res = await api.post(`/community/users/${profileData.user._id}/follow`);
      if (res.data.success) {
        const { isFollowing, followersCount, message } = res.data;
        toast.success(message);
        setProfileData((prev: any) => ({
          ...prev,
          user: {
            ...prev.user,
            isFollowing,
            followersCount
          }
        }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to update follow status.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      if (res.data.success) {
        setProfileData((prev: any) => {
          if (!prev?.recentPosts) return prev;
          return {
            ...prev,
            recentPosts: prev.recentPosts.map((p: any) => {
              if (p._id === postId) {
                const hasLiked = p.likes?.includes(currentUser?.id);
                return {
                  ...p,
                  likes: hasLiked
                    ? p.likes.filter((id: string) => id !== currentUser?.id)
                    : [...(p.likes || []), currentUser?.id]
                };
              }
              return p;
            })
          };
        });
      }
    } catch (err) {
      toast.error("Failed to update like status.");
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) {
      toast.error("Please enter a comment before submitting.");
      return;
    }

    try {
      const res = await api.post(`/community/posts/${postId}/comments`, { content: content.trim() });
      if (res.data.success) {
        toast.success("Comment added!");
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        // Refresh profile data to load updated comments
        const refreshed = await api.get(`/community/users/${athleteId}/profile`);
        if (refreshed.data.success) {
          setProfileData(refreshed.data.data);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to add comment. Please try again.");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-text-muted">Loading athlete profile...</p>
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Athlete Not Found</h2>
        <p className="text-sm text-text-muted">This athlete profile does not exist or has been removed.</p>
        <Link
          href="/member/community"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community Feed</span>
        </Link>
      </div>
    );
  }

  const { user, profile, metrics, recentPosts } = profileData;
  const initial = user.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/member/community')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-primary bg-surface border border-border px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs hover:bg-slate-100 dark:hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary bg-surface border border-border px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs hover:bg-slate-100 dark:hover:bg-white/[0.05]"
          title="Share profile"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Share Profile</span>
        </button>
      </div>

      {/* Hero Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm"
      >
        {/* Cover Accent Gradient */}
        <div className="h-32 md:h-44 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
        </div>

        {/* Profile Details Container */}
        <div className="px-6 md:px-8 pb-8 pt-0 relative">
          {/* Avatar & Action Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-surface border-4 border-surface overflow-hidden shadow-xl flex items-center justify-center text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 shrink-0">
              {user.avatar ? (
                <img 
                  src={formatImageUrl(user.avatar)} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              {!user.isSelf ? (
                <>
                  <button
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                      user.isFollowing
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-white/[0.08] dark:hover:bg-rose-500/10 dark:text-slate-300 dark:hover:text-rose-400 border border-border'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {user.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow Athlete</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/member/inbox?user=${user._id}`}
                    className="px-4 py-2.5 rounded-full bg-surface border border-border hover:bg-slate-100 dark:hover:bg-white/[0.05] text-text-primary text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4 text-text-muted" />
                    <span>Message</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/member/settings?tab=profile"
                  className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </Link>
              )}
            </div>
          </div>

          {/* Name & Role */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">
                {user.name}
              </h1>
              {user.role === 'coach' && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Coach
                </span>
              )}
              {user.role === 'admin' && (
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                  HQ Admin
                </span>
              )}
              {user.isSelf && (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-white/[0.08] px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>

            {user.bio ? (
              <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-text-muted/60 italic">
                No bio written yet.
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-text-muted pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
            <div className="p-3.5 rounded-2xl bg-background/50 border border-border flex flex-col">
              <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
                <Dumbbell className="w-3.5 h-3.5 text-indigo-500" />
                Workouts
              </span>
              <span className="text-xl font-bold font-display text-text-primary">
                {metrics?.totalWorkouts || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-background/50 border border-border flex flex-col">
              <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                Posts
              </span>
              <span className="text-xl font-bold font-display text-text-primary">
                {metrics?.totalPosts || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-background/50 border border-border flex flex-col">
              <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Followers
              </span>
              <span className="text-xl font-bold font-display text-text-primary">
                {user.followersCount || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-background/50 border border-border flex flex-col">
              <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Following
              </span>
              <span className="text-xl font-bold font-display text-text-primary">
                {user.followingCount || 0}
              </span>
            </div>
          </div>

          {/* Fitness Goals */}
          {profile?.fitnessGoals && profile.fitnessGoals.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border space-y-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                Primary Goals
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.fitnessGoals.map((goal: string, idx: number) => (
                  <span 
                    key={idx}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 capitalize flex items-center gap-1.5"
                  >
                    <Flame className="w-3 h-3" />
                    {goal.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Athlete Activity & Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>Activity & Milestones ({recentPosts?.length || 0})</span>
          </h2>
        </div>

        {recentPosts?.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-3xl border border-border p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-primary">No activity shared yet.</p>
            <p className="text-xs text-text-muted">
              When {user.name} logs training wins or attaches photos, they will appear here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post: any) => (
              <motion.div
                key={post._id}
                layout
                className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm"
              >
                {/* Post Author / Timestamp */}
                <div className="p-6 pb-3 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                    {user.avatar ? (
                      <img src={formatImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary tracking-tight leading-snug">
                      {user.name}
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Content */}
                {post.content && (
                  <div className="px-6 pb-3">
                    <p className="text-text-primary leading-relaxed text-sm whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>
                )}

                {/* Optional Image */}
                {post.imageUrl && (
                  <div className="px-6 pb-3">
                    <div className="rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/20 max-h-[500px] flex items-center justify-center">
                      <img 
                        src={formatImageUrl(post.imageUrl)} 
                        alt="Post attachment" 
                        className="w-full h-auto max-h-[500px] object-contain rounded-2xl" 
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                {/* Engagement Bar */}
                <div className="px-6 py-3.5 border-t border-border flex items-center gap-6 mt-2">
                  <div onClick={() => handleToggleLike(post._id)} className="cursor-pointer">
                    <LikeButton initialLikes={post.likes?.length || 0} />
                  </div>
                  <button 
                    onClick={() => setExpandedComments(expandedComments === post._id ? null : post._id)}
                    className="flex items-center gap-2 text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1.5 rounded-full cursor-pointer text-xs font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments?.length || 0} Comments</span>
                  </button>
                </div>

                {/* Comments Accordion */}
                <AnimatePresence>
                  {expandedComments === post._id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-background/50 border-t border-border"
                    >
                      <div className="p-6 space-y-4">
                        {post.comments?.length === 0 && (
                          <p className="text-xs text-text-muted italic">No comments yet. Start the conversation!</p>
                        )}

                        {post.comments?.map((c: any) => {
                          const commentAuthorName = c.author?.name || "FitCore Athlete";
                          const commentInitial = commentAuthorName.charAt(0).toUpperCase() || "A";

                          return (
                            <div key={c._id} className="flex gap-3 items-start">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden mt-0.5">
                                {c.author?.avatar ? (
                                  <img src={formatImageUrl(c.author.avatar)} alt={commentAuthorName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{commentInitial}</span>
                                )}
                              </div>
                              <div className="flex-1 bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-2.5 max-w-lg shadow-sm">
                                <span className="font-semibold text-xs text-text-primary block mb-1">
                                  {commentAuthorName}
                                </span>
                                <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed block">
                                  {c.content}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Comment Input */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 relative">
                            <input 
                              type="text" 
                              value={commentInputs[post._id] || ""}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                              placeholder="Write a comment..."
                              className="w-full bg-surface border border-border rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-text-primary placeholder:text-text-muted"
                            />
                            <button 
                              type="button"
                              onClick={() => handleCommentSubmit(post._id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 p-1 cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

