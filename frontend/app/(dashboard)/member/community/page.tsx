"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image as ImageIcon, 
  Send, 
  MessageCircle, 
  X, 
  Loader2, 
  MoreHorizontal, 
  Trash2, 
  Users, 
  User as UserIcon,
  Sparkles, 
  AlertTriangle,
  Trophy,
  Globe,
  Plus,
  Heart,
  Bookmark,
  BadgeCheck,
  Share2,
  TrendingUp,
  Flame,
  Dumbbell
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

type FeedTab = "all" | "following" | "me";

const MILESTONE_TAGS = [
  { label: "PR Milestone", tag: "#PersonalRecord 🏆" },
  { label: "Leg Day", tag: "#LegDay 🔥" },
  { label: "Cardio & 5K", tag: "#CardioRun 🏃" },
  { label: "Clean Macros", tag: "#NutritionPrep 🥗" },
  { label: "Daily Habit", tag: "#ConsistencyStreak ⚡" }
];

function getDisplayName(author: any): string {
  if (!author) return "FitCore Athlete";
  if (typeof author === "string") return author;
  if (author.name && author.name.trim()) return author.name.trim();
  if (author.firstName) return `${author.firstName} ${author.lastName || ""}`.trim();
  if (author.email) return author.email.split("@")[0];
  return "FitCore Athlete";
}

function getDisplayInitial(author: any): string {
  const name = getDisplayName(author);
  return name.charAt(0).toUpperCase() || "A";
}

function getHandle(author: any): string {
  if (!author) return "athlete";
  if (author.username) return author.username.toLowerCase();
  if (author.name) {
    return author.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }
  if (author.firstName) {
    return `${author.firstName}_${author.lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  if (author.email) {
    return author.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  return "athlete";
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.max(1, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

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

export default function CommunityPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [heartAnimPostId, setHeartAnimPostId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Post Actions Menu State
  const [openActionPostId, setOpenActionPostId] = useState<string | null>(null);

  // Delete Post Modal State
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-action-menu]')) {
        setOpenActionPostId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchPosts = async (tab: FeedTab = activeTab) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/community/posts?filter=${tab}`);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
      toast.error("Unable to load community feed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
  };

  const handleAddTag = (tag: string) => {
    if (!newPostContent.includes(tag.trim())) {
      setNewPostContent(prev => prev ? `${prev} ${tag}` : tag);
    }
    textareaRef.current?.focus();
  };

  // Image Selection Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (PNG, JPG, WebP, etc.)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsComposerExpanded(true);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedImage) {
      toast.error("Please write a message or attach a photo before posting.");
      return;
    }

    setIsPosting(true);
    try {
      const formData = new FormData();
      if (newPostContent.trim()) {
        formData.append('content', newPostContent.trim());
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await api.post('/community/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success("Post published to community feed!");
        setNewPostContent("");
        removeSelectedImage();
        setIsComposerExpanded(false);
        fetchPosts(activeTab);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Unable to publish post. Please try again.";
      toast.error(errorMsg, { id: 'post-error' });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDiscardDraft = () => {
    setNewPostContent("");
    removeSelectedImage();
    setIsComposerExpanded(false);
  };

  // Delete Post Handlers
  const handleDeletePostClick = (postId: string) => {
    setOpenActionPostId(null);
    setPostToDelete(postId);
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      const res = await api.delete(`/community/posts/${postToDelete}`);
      if (res.data.success) {
        toast.success("Post deleted successfully.");
        setPosts((prev) => prev.filter((p) => p._id !== postToDelete));
        setPostToDelete(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete post.");
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Delete Comment Handler
  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const res = await api.delete(`/community/posts/${postId}/comments/${commentId}`);
      if (res.data.success) {
        toast.success("Comment removed.");
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                comments: p.comments.filter((c: any) => c._id !== commentId)
              };
            }
            return p;
          })
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  // Toggle Follow Handler
  const handleToggleFollow = async (targetUserId: string) => {
    if (!targetUserId || targetUserId === user?.id) return;
    setIsFollowLoading(true);
    try {
      const res = await api.post(`/community/users/${targetUserId}/follow`);
      if (res.data.success) {
        const { isFollowing, message } = res.data;
        toast.success(message);

        setPosts((prev) =>
          prev.map((p) => {
            if (p.author?._id === targetUserId) {
              const currentFollowers = p.author.followers || [];
              const updatedFollowers = isFollowing
                ? [...currentFollowers, user?.id]
                : currentFollowers.filter((id: string) => id !== user?.id);
              return {
                ...p,
                author: {
                  ...p.author,
                  followers: updatedFollowers
                }
              };
            }
            return p;
          })
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to update follow status.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const navigateToProfile = (authorId?: string) => {
    if (!authorId) return;
    router.push(`/member/community/profile/${authorId}`);
  };

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/member/community#post-${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Post link copied to clipboard!");
    setOpenActionPostId(null);
  };

  const handleToggleSavePost = (postId: string) => {
    setSavedPosts(prev => {
      const updated = new Set(prev);
      if (updated.has(postId)) {
        updated.delete(postId);
        toast.success("Removed from bookmarks");
      } else {
        updated.add(postId);
        toast.success("Saved to bookmarks");
      }
      return updated;
    });
  };

  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) {
      return;
    }

    try {
      const res = await api.post(`/community/posts/${postId}/comments`, { content: content.trim() });
      if (res.data.success) {
        toast.success("Comment added!");
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchPosts(activeTab);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to add comment. Please try again.");
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await api.post(`/community/posts/${postId}/like`);
      setPosts(prev =>
        prev.map(p => {
          if (p._id === postId) {
            const hasLiked = p.likes?.includes(user?.id);
            const updatedLikes = hasLiked
              ? p.likes.filter((id: string) => id !== user?.id)
              : [...(p.likes || []), user?.id];
            return { ...p, likes: updatedLikes };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  // Double-tap photo to like
  const handleDoubleTapPhoto = (postId: string) => {
    setHeartAnimPostId(postId);
    setTimeout(() => setHeartAnimPostId(null), 900);
    const post = posts.find(p => p._id === postId);
    if (post && !post.likes?.includes(user?.id)) {
      handleToggleLike(postId);
    }
  };

  // Unique community athletes for suggestions in the right sidebar
  const suggestedAthletes = (() => {
    const athleteMap = new Map<string, any>();
    for (const p of posts) {
      if (p.author?._id && p.author._id !== user?.id && !athleteMap.has(p.author._id)) {
        athleteMap.set(p.author._id, p.author);
      }
    }
    return Array.from(athleteMap.values()).slice(0, 6);
  })();

  const followingCount = user?.following?.length || 0;

  return (
    <div className="max-w-6xl mx-auto flex justify-center gap-8 xl:gap-12 pb-24 pt-2">
      
      {/* ========================================================
          MAIN FEED STREAM COLUMN (Left / Center)
         ======================================================== */}
      <div className="w-full max-w-[620px] shrink-0 space-y-5">
        
        {/* 1. COMMUNITY HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Community Feed
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Connect with athletes, log PR milestones, and share training wins.
            </p>
          </div>

          <Link
            href="/member/community/challenges"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface border border-border hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold text-text-primary transition-all shadow-2xs self-start sm:self-auto hover:border-amber-500/40 group cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>Active Challenges</span>
          </Link>
        </div>

        {/* 2. POST CREATOR: Clean Collapsed Trigger vs Expanded Social Composer */}
        <div className="bg-surface rounded-3xl border border-border shadow-xs overflow-hidden transition-all">
          {!isComposerExpanded ? (
            /* Sleek Collapsed Trigger Card */
            <div 
              onClick={() => {
                setIsComposerExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 60);
              }}
              className="p-4 sm:p-5 space-y-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                  {user?.avatar ? (
                    <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>

                <div className="flex-1 bg-background hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-border rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-text-muted transition-colors flex items-center justify-between">
                  <span className="truncate">
                    Share your latest workout, milestone, or training win...
                  </span>
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 ml-2" />
                </div>
              </div>

              {/* Bottom Quick Action Row */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageSelect} 
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 text-xs font-medium text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <span>Photo</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsComposerExpanded(true);
                    setTimeout(() => textareaRef.current?.focus(), 60);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>Post</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Expanded Full Rich Composer */
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 sm:p-6 space-y-4"
            >
              <form onSubmit={handlePostSubmit} className="space-y-4">
                {/* Author Info & Discard Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                      {user?.avatar ? (
                        <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary">
                          {user?.name || "Athlete"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-background border border-border text-text-muted">
                          <Globe className="w-3 h-3 text-indigo-500" />
                          <span>Public Feed</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">Share your daily training with the community</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close composer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`What's your workout win today, ${user?.name ? user.name.split(' ')[0] : 'Athlete'}? Log a PR, share a routine, or celebrate a milestone...`}
                  maxLength={500}
                  rows={4}
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none border-b border-border/50 pb-2 leading-relaxed"
                />

                {/* Quick Fitness Milestone Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Quick Milestone Tags:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {MILESTONE_TAGS.map(({ label, tag }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 border border-border/60 transition-colors cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Preview */}
                {previewUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-black/10">
                    <img 
                      src={previewUrl} 
                      alt="Upload preview" 
                      className="w-full max-h-72 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer shadow-md"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 text-xs font-semibold text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer border border-border"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>{selectedImage ? "Change Photo" : "Add Photo"}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-text-muted">
                      {newPostContent.length}/500
                    </span>

                    <button 
                      type="submit"
                      disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-xs font-semibold shadow-md shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <span>Publish Post</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* 3. FEED NAVIGATION TABS: Clean Segmented Bar (Non-sticky) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface border border-border shadow-2xs">
            <button
              onClick={() => handleTabChange('all')}
              className={`py-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>For You</span>
            </button>

            <button
              onClick={() => handleTabChange('following')}
              className={`py-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'following'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Following</span>
              {followingCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'following' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {followingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('me')}
              className={`py-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'me'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>My Posts</span>
            </button>
          </div>

          {!isLoading && posts.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium px-2 sm:px-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{posts.length} {posts.length === 1 ? 'post' : 'posts'} active</span>
            </div>
          )}
        </div>

        {/* 4. POST FEED STREAM */}
        <div className="space-y-5 pt-1">
          {isLoading && (
            <div className="text-center py-16 flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
              <span className="text-xs text-text-muted">Loading community posts...</span>
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <div className="text-center py-14 bg-surface rounded-3xl border border-border p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              {activeTab === 'following' ? (
                <>
                  <p className="text-sm font-semibold text-text-primary">You are not following any athletes yet.</p>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    Check out the suggested athletes on the right or explore the &quot;For You&quot; feed!
                  </p>
                  <button
                    onClick={() => handleTabChange('all')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    Explore For You Feed
                  </button>
                </>
              ) : activeTab === 'me' ? (
                <>
                  <p className="text-sm font-semibold text-text-primary">You haven&apos;t shared any posts yet.</p>
                  <p className="text-xs text-text-muted">Share your first training milestone or PR above!</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-primary">No community posts yet.</p>
                  <p className="text-xs text-text-muted">Be the first to share your workout milestone with fellow athletes!</p>
                </>
              )}
            </div>
          )}

          <AnimatePresence>
            {posts.map(post => {
              const authorName = getDisplayName(post.author);
              const authorHandle = getHandle(post.author);
              const authorInitial = getDisplayInitial(post.author);
              const isSelf = post.author?._id === user?.id;
              const canDelete = isSelf || user?.role === 'admin';
              const isFollowing = (post.author?.followers || []).includes(user?.id);
              const hasLiked = (post.likes || []).includes(user?.id);
              const isSaved = savedPosts.has(post._id);
              const timeAgo = formatTimeAgo(post.createdAt);
              const isCommentsOpen = expandedComments === post._id;

              return (
                <motion.article 
                  key={post._id}
                  id={`post-${post._id}`}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-surface rounded-3xl border border-border overflow-hidden shadow-xs hover:border-border/90 transition-colors"
                >
                  {/* Post Header: Avatar, Name, Handle, Role Badge, Follow Pill, Three-Dots */}
                  <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => navigateToProfile(post.author?._id)}
                        className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                        title={`View ${authorName}'s profile`}
                      >
                        {post.author?.avatar ? (
                          <img src={formatImageUrl(post.author.avatar)} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{authorInitial}</span>
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => navigateToProfile(post.author?._id)}
                            className="font-bold text-sm text-text-primary hover:underline truncate cursor-pointer text-left"
                          >
                            {authorName}
                          </button>

                          {post.author?.role === 'coach' && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase">
                              Coach
                            </span>
                          )}

                          {post.author?.role === 'admin' && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded uppercase">
                              HQ
                            </span>
                          )}

                          <span className="text-xs text-text-muted">
                            @{authorHandle}
                          </span>
                        </div>

                        <p className="text-[11px] text-text-muted mt-0.5">
                          {timeAgo}
                        </p>
                      </div>
                    </div>

                    {/* Header Right Actions: Follow Button & Three-Dots Menu */}
                    <div className="flex items-center gap-2 relative" data-action-menu>
                      {!isSelf && post.author?._id && (
                        <button
                          type="button"
                          onClick={() => handleToggleFollow(post.author?._id)}
                          disabled={isFollowLoading}
                          className={`text-xs font-semibold px-3 py-1 rounded-full transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-white/[0.08] dark:hover:bg-rose-500/10 dark:text-slate-300 dark:hover:text-rose-400 border border-border'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setOpenActionPostId(openActionPostId === post._id ? null : post._id)}
                        className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Post options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Options */}
                      {openActionPostId === post._id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-surface dark:bg-zinc-900 rounded-2xl border border-border shadow-xl py-1 z-30 text-xs">
                          {!isSelf && post.author?._id && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionPostId(null);
                                router.push(`/member/inbox?user=${post.author._id}`);
                              }}
                              className="w-full px-3.5 py-2 text-left text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Direct Message</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionPostId(null);
                              navigateToProfile(post.author?._id);
                            }}
                            className="w-full px-3.5 py-2 text-left text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                          >
                            <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                            <span>View Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(post._id)}
                            className="w-full px-3.5 py-2 text-left text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-text-muted" />
                            <span>Copy Link</span>
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeletePostClick(post._id)}
                              className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 border-t border-border/50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Post</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Caption */}
                  {post.content && (
                    <div className="px-4 sm:px-5 pb-3">
                      <p className="text-sm text-text-primary leading-relaxed">
                        {post.content.split(' ').map((word: string, i: number) => {
                          if (word.startsWith('#')) {
                            return (
                              <span key={i} className="text-indigo-600 dark:text-indigo-400 font-medium mr-1">
                                {word}{' '}
                              </span>
                            );
                          }
                          return word + ' ';
                        })}
                      </p>
                    </div>
                  )}

                  {/* Post Photo (with double-click heart animation) */}
                  {post.imageUrl && (
                    <div 
                      onDoubleClick={() => handleDoubleTapPhoto(post._id)}
                      className="relative w-full bg-black/5 dark:bg-black/30 overflow-hidden cursor-pointer select-none group"
                    >
                      <img 
                        src={formatImageUrl(post.imageUrl)} 
                        alt="Workout post" 
                        className="w-full max-h-[520px] object-cover transition-transform duration-300 group-hover:scale-[1.008]"
                        loading="lazy"
                      />

                      {/* Double-tap Bouncing Heart */}
                      {heartAnimPostId === post._id && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                        >
                          <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Post Social Interactions Bar */}
                  <div className="px-4 sm:px-5 pt-3 pb-2 flex items-center justify-between border-t border-border/40">
                    <div className="flex items-center gap-4">
                      {/* Like Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post._id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-rose-500 transition-colors cursor-pointer active:scale-90"
                      >
                        <Heart 
                          className={`w-5 h-5 transition-colors ${
                            hasLiked 
                              ? 'text-rose-500 fill-rose-500 scale-105' 
                              : 'text-text-muted hover:text-rose-500'
                          }`} 
                        />
                        <span>{post.likes?.length || 0}</span>
                      </button>

                      {/* Comments Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedComments(isCommentsOpen ? null : post._id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-indigo-500 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments?.length || 0}</span>
                      </button>

                      {/* Direct Message Athlete */}
                      {!isSelf && post.author?._id && (
                        <button
                          type="button"
                          onClick={() => router.push(`/member/inbox?user=${post.author._id}`)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-indigo-500 transition-colors cursor-pointer"
                          title="Message Athlete"
                        >
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Message</span>
                        </button>
                      )}
                    </div>

                    {/* Bookmark Save */}
                    <button
                      type="button"
                      onClick={() => handleToggleSavePost(post._id)}
                      className="text-text-muted hover:text-amber-500 transition-colors cursor-pointer"
                      title={isSaved ? "Saved" : "Save"}
                    >
                      <Bookmark 
                        className={`w-5 h-5 transition-colors ${
                          isSaved ? 'text-amber-500 fill-amber-500' : 'text-text-muted'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Comments Section */}
                  {isCommentsOpen && (
                    <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-border/40 space-y-3 bg-slate-50/50 dark:bg-white/[0.01]">
                      {/* Comments List */}
                      {post.comments?.length > 0 ? (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {post.comments.map((comment: any) => {
                            const cAuthorName = getDisplayName(comment.author);
                            const cAuthorInitial = getDisplayInitial(comment.author);
                            const isCommentAuthor = comment.author?._id === user?.id || comment.author === user?.id;
                            const canDeleteComment = isCommentAuthor || canDelete;

                            return (
                              <div key={comment._id} className="flex items-start justify-between gap-2.5 group">
                                <div className="flex items-start gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                    {comment.author?.avatar ? (
                                      <img src={formatImageUrl(comment.author.avatar)} alt={cAuthorName} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                      <span>{cAuthorInitial}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-text-primary">
                                        {cAuthorName}
                                      </span>
                                      <span className="text-[10px] text-text-muted">
                                        {formatTimeAgo(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-text-primary mt-0.5 leading-snug">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>

                                {canDeleteComment && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(post._id, comment._id)}
                                    className="text-text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer shrink-0"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted text-center py-2">No comments yet. Start the conversation!</p>
                      )}

                      {/* Inline Comment Composer */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post._id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit(post._id);
                            }
                          }}
                          className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          disabled={!commentInputs[post._id]?.trim()}
                          onClick={() => handleCommentSubmit(post._id)}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDEBAR: Suggested Athletes & Community Hub
         ======================================================== */}
      <aside className="hidden lg:block w-[320px] xl:w-[350px] shrink-0 space-y-5 pt-2">
        
        {/* 1. Logged-in Athlete Profile Summary Card */}
        <div className="bg-surface rounded-3xl border border-border p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push('/member/profile')}
              className="w-12 h-12 rounded-full overflow-hidden bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-base shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              {user?.avatar ? (
                <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </button>

            <div className="min-w-0">
              <button
                type="button"
                onClick={() => router.push('/member/profile')}
                className="font-bold text-sm text-text-primary hover:underline truncate block text-left"
              >
                {user?.name || "FitCore Athlete"}
              </button>
              <p className="text-xs text-text-muted truncate">
                @{getHandle(user)}
              </p>
              <span className="inline-block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full mt-1">
                {user?.role === 'coach' ? 'Coach' : 'Member'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-text-muted">Following: <strong className="text-text-primary">{followingCount}</strong></span>
            <Link 
              href="/member/profile" 
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Profile &rarr;
            </Link>
          </div>
        </div>

        {/* 2. SUGGESTED ATHLETES & COACHES */}
        <div className="bg-surface rounded-3xl border border-border p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Suggested for You
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          {/* List of Suggestions */}
          <div className="space-y-3.5 pt-1">
            {suggestedAthletes.map((athlete: any) => {
              const displayName = getDisplayName(athlete);
              const handle = getHandle(athlete);
              const initial = getDisplayInitial(athlete);
              const isCoach = athlete.role === 'coach';
              const isFollowing = (athlete.followers || []).includes(user?.id);

              return (
                <div key={athlete._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => navigateToProfile(athlete._id)}
                      className="w-10 h-10 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    >
                      {athlete.avatar ? (
                        <img src={formatImageUrl(athlete.avatar)} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigateToProfile(athlete._id)}
                          className="font-bold text-xs text-text-primary hover:underline truncate text-left cursor-pointer"
                        >
                          {displayName}
                        </button>
                        {isCoach && (
                          <span title="Verified Coach">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {isCoach ? 'FitCore Coach' : `@${handle}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(athlete._id)}
                    disabled={isFollowLoading}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                      isFollowing 
                        ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 border border-border' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}

            {suggestedAthletes.length === 0 && (
              <p className="text-xs text-text-muted text-center py-2">
                No new athlete suggestions right now.
              </p>
            )}
          </div>
        </div>

        {/* 3. ACTIVE CHALLENGES HIGHLIGHT CARD */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl border border-indigo-500/20 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              Community Challenge
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              Active
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Join the <strong>30-Day PR Challenge</strong>. Log daily workouts, crush milestone goals, and earn community points.
          </p>

          <Link
            href="/member/community/challenges"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
          >
            <span>View All Challenges</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* 4. TRENDING FITNESS TOPICS */}
        <div className="bg-surface rounded-3xl border border-border p-5 shadow-2xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            Trending Topics
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {MILESTONE_TAGS.map(({ label, tag }) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="text-xs px-2.5 py-1 rounded-xl bg-background border border-border hover:border-indigo-500/40 text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. FOOTER */}
        <div className="px-2 pt-1 text-[11px] text-text-muted/70 space-y-1">
          <p>&copy; 2026 FitCore Community &bull; Fitness &amp; Coaching Hub</p>
        </div>
      </aside>

      {/* Delete Post Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl border border-border max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Delete Post?</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                disabled={isDeletingPost}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePost}
                disabled={isDeletingPost}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isDeletingPost ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
