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
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Smile,
  Share2
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
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w`;
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
  const storiesRef = useRef<HTMLDivElement>(null);

  // Scroll button visibility for stories
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const checkScrollButtons = () => {
    if (storiesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleScrollStories = (direction: 'left' | 'right') => {
    if (storiesRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      storiesRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

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
      toast.error("Please write a caption or attach a photo before posting.");
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
        toast.success("Post shared to community feed!");
        setNewPostContent("");
        removeSelectedImage();
        setIsComposerExpanded(false);
        fetchPosts(activeTab);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Unable to share post. Please try again.";
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
        toast.success("Post removed from saved");
      } else {
        updated.add(postId);
        toast.success("Post saved to bookmarks");
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
        toast.success("Comment posted!");
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

  // Double-tap photo to like with Instagram bounce animation
  const handleDoubleTapPhoto = (postId: string) => {
    setHeartAnimPostId(postId);
    setTimeout(() => setHeartAnimPostId(null), 900);
    const post = posts.find(p => p._id === postId);
    if (post && !post.likes?.includes(user?.id)) {
      handleToggleLike(postId);
    }
  };

  // Unique community athletes for stories reel & sidebar suggestions
  const featuredAthletes = (() => {
    const athleteMap = new Map<string, any>();
    for (const p of posts) {
      if (p.author?._id && p.author._id !== user?.id && !athleteMap.has(p.author._id)) {
        athleteMap.set(p.author._id, p.author);
      }
    }
    return Array.from(athleteMap.values()).slice(0, 12);
  })();

  const followingCount = user?.following?.length || 0;

  return (
    <div className="max-w-5xl mx-auto flex justify-center gap-8 xl:gap-14 pb-20 pt-1">
      
      {/* ========================================================
          LEFT / CENTER FEED COLUMN (Max-w ~500-540px like Instagram)
         ======================================================== */}
      <div className="w-full max-w-[500px] shrink-0 space-y-4">
        
        {/* 1. INSTAGRAM-STYLE STORIES REEL */}
        <div className="relative bg-surface/80 dark:bg-[#121214] border border-border/80 rounded-2xl py-3 px-3 shadow-xs">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollStories('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 text-black dark:text-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              aria-label="Previous stories"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {/* Stories Reel Container */}
          <div 
            ref={storiesRef}
            onScroll={checkScrollButtons}
            className="overflow-x-auto no-scrollbar flex items-start gap-4 px-1 scroll-smooth"
          >
            {/* Story 1: Current User "Your PR" */}
            <div 
              onClick={() => {
                setIsComposerExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 60);
              }}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none"
            >
              <div className="relative w-16 h-16 rounded-full p-[2px] bg-slate-200 dark:bg-white/10 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-surface flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {user?.avatar ? (
                    <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                {/* Blue Plus Badge */}
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-sky-500 text-white border-2 border-background flex items-center justify-center shadow-xs">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <span className="text-[11px] font-normal text-text-primary mt-1.5 truncate max-w-[66px] text-center">
                Your PR
              </span>
            </div>

            {/* Other Athletes & Coaches Stories */}
            {featuredAthletes.map((athlete: any) => {
              const handle = getHandle(athlete);
              const displayName = getDisplayName(athlete);
              const initial = getDisplayInitial(athlete);
              const isCoach = athlete.role === 'coach';

              return (
                <div
                  key={athlete._id}
                  onClick={() => navigateToProfile(athlete._id)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none"
                  title={`View ${displayName}'s profile`}
                >
                  {/* Instagram Gradient Ring: Yellow to Fuchsia */}
                  <div className={`relative w-16 h-16 rounded-full p-[2.5px] transition-transform group-hover:scale-105 shadow-2xs ${
                    isCoach
                      ? 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500'
                      : 'bg-gradient-to-tr from-yellow-400 via-rose-500 to-fuchsia-600'
                  }`}>
                    <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-surface flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {athlete.avatar ? (
                        <img src={formatImageUrl(athlete.avatar)} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                  </div>

                  {/* Handle below story */}
                  <span className="text-[11px] font-normal text-text-primary mt-1.5 truncate max-w-[66px] text-center">
                    {handle.length > 9 ? `${handle.slice(0, 8)}…` : handle}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollStories('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 text-black dark:text-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              aria-label="Next stories"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* 2. POST CREATOR: COMPACT TRIGGER vs EXPANDED MODAL COMPOSER */}
        <div className="bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-xs transition-all">
          {!isComposerExpanded ? (
            <div 
              onClick={() => {
                setIsComposerExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 60);
              }}
              className="p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                {user?.avatar ? (
                  <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>

              <div className="flex-1 bg-background hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-border rounded-full px-4 py-2 text-xs text-text-muted transition-colors flex items-center justify-between">
                <span className="truncate">
                  What&apos;s on your workout log, {user?.name?.split(' ')[0] || 'Athlete'}?
                </span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-2" />
              </div>

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
                className="p-2 rounded-xl bg-background hover:bg-indigo-500/10 border border-border text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer shadow-2xs"
                title="Attach Photo"
              >
                <ImageIcon className="w-4 h-4 text-indigo-500" />
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 sm:p-5 space-y-3"
            >
              <form onSubmit={handlePostSubmit} className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {user?.avatar ? (
                        <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-text-primary">
                          {user?.name || "Athlete"}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          @{getHandle(user)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        <Globe className="w-2.5 h-2.5" /> Public Feed
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Discard post"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`Write a caption, log a PR, or share your workout milestone...`}
                  maxLength={500}
                  rows={3}
                  className="w-full bg-transparent text-xs sm:text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none border-b border-border/50 pb-2"
                />

                {/* Quick Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-1">
                    Tags:
                  </span>
                  {MILESTONE_TAGS.map(({ label, tag }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 border border-border/60 transition-colors cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-black/10">
                    <img 
                      src={previewUrl} 
                      alt="Selected preview" 
                      className="w-full max-h-60 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 text-xs font-medium text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
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
                      className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Sharing...</span>
                        </>
                      ) : (
                        <>
                          <span>Share</span>
                          <Send className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* 3. FEED NAVIGATION TABS: For You • Following • My Posts */}
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border shadow-2xs">
            <button
              onClick={() => handleTabChange('all')}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>For You</span>
            </button>

            <button
              onClick={() => handleTabChange('following')}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'following'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Following</span>
              {followingCount > 0 && (
                <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                  activeTab === 'following' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                }`}>
                  {followingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('me')}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'me'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <UserIcon className="w-3 h-3" />
              <span>My Posts</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-text-muted font-medium pr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
          </div>
        </div>

        {/* 4. POST FEED STREAM */}
        <div className="space-y-4 pt-1">
          {isLoading && (
            <div className="text-center py-16 flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-sky-500" />
              <span className="text-xs text-text-muted">Loading posts...</span>
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <div className="text-center py-14 bg-surface rounded-2xl border border-border p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              {activeTab === 'following' ? (
                <>
                  <p className="text-sm font-semibold text-text-primary">No posts from accounts you follow.</p>
                  <p className="text-xs text-text-muted max-w-xs mx-auto">
                    Follow athletes and coaches from the right sidebar to see their posts here!
                  </p>
                  <button
                    onClick={() => handleTabChange('all')}
                    className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    Explore For You Feed
                  </button>
                </>
              ) : activeTab === 'me' ? (
                <>
                  <p className="text-sm font-semibold text-text-primary">No posts shared yet.</p>
                  <p className="text-xs text-text-muted">Share your first workout win or milestone above!</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-primary">No posts found.</p>
                  <p className="text-xs text-text-muted">Be the first to share your fitness milestone!</p>
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
                  className="bg-surface dark:bg-[#121214] rounded-2xl border border-border/80 overflow-hidden shadow-xs"
                >
                  {/* POST HEADER: Avatar, Handle, Verified, TimeAgo, Three-Dots Menu */}
                  <div className="px-3.5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar with subtle ring */}
                      <button
                        type="button"
                        onClick={() => navigateToProfile(post.author?._id)}
                        className="relative w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 flex items-center justify-center shrink-0 cursor-pointer"
                        title={`View ${authorName}'s profile`}
                      >
                        <div className="w-full h-full rounded-full border border-background overflow-hidden bg-surface flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {post.author?.avatar ? (
                            <img src={formatImageUrl(post.author.avatar)} alt={authorName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{authorInitial}</span>
                          )}
                        </div>
                      </button>

                      {/* Handle, Verified Badge & Time */}
                      <div className="flex items-center gap-1.5 truncate">
                        <button
                          type="button"
                          onClick={() => navigateToProfile(post.author?._id)}
                          className="font-semibold text-xs text-text-primary hover:underline truncate cursor-pointer"
                        >
                          {authorHandle}
                        </button>

                        {/* Verified badge */}
                        {(post.author?.role === 'coach' || post.author?.role === 'admin' || post.author?.isVerified) && (
                          <span title="Verified Athlete">
                            <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500/20 shrink-0" />
                          </span>
                        )}

                        <span className="text-[11px] text-text-muted shrink-0">
                          • {timeAgo}
                        </span>
                      </div>
                    </div>

                    {/* Right Menu Action */}
                    <div className="relative" data-action-menu>
                      <button
                        type="button"
                        onClick={() => setOpenActionPostId(openActionPostId === post._id ? null : post._id)}
                        className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Post actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Options */}
                      {openActionPostId === post._id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-surface dark:bg-zinc-900 rounded-xl border border-border shadow-xl py-1 z-30 text-xs">
                          {!isSelf && post.author?._id && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionPostId(null);
                                router.push(`/member/inbox?user=${post.author._id}`);
                              }}
                              className="w-full px-3 py-2 text-left text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5 text-sky-500" />
                              <span>Direct Message</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionPostId(null);
                              navigateToProfile(post.author?._id);
                            }}
                            className="w-full px-3 py-2 text-left text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                          >
                            <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                            <span>View Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(post._id)}
                            className="w-full px-3 py-2 text-left text-text-primary hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-text-muted" />
                            <span>Copy Link</span>
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeletePostClick(post._id)}
                              className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 border-t border-border/50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Post</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* POST MEDIA / PHOTO (Double tap to like) */}
                  {post.imageUrl && (
                    <div 
                      onDoubleClick={() => handleDoubleTapPhoto(post._id)}
                      className="relative w-full bg-black/5 dark:bg-black/40 overflow-hidden cursor-pointer select-none group"
                    >
                      <img 
                        src={formatImageUrl(post.imageUrl)} 
                        alt="Community post media" 
                        className="w-full max-h-[540px] object-cover transition-transform duration-300 group-hover:scale-[1.008]"
                        loading="lazy"
                      />

                      {/* Instagram Double-Tap Bouncing Heart Animation */}
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

                  {/* POST ACTION BUTTONS ROW (Heart, Comment, Send, Bookmark) */}
                  <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Heart (Like) Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post._id)}
                        className="group cursor-pointer transition-transform active:scale-75"
                        title={hasLiked ? "Unlike" : "Like"}
                      >
                        <Heart 
                          className={`w-6 h-6 transition-colors ${
                            hasLiked 
                              ? 'text-rose-500 fill-rose-500 scale-105' 
                              : 'text-text-primary hover:text-rose-500'
                          }`} 
                        />
                      </button>

                      {/* Comment Bubble Button */}
                      <button
                        type="button"
                        onClick={() => setExpandedComments(isCommentsOpen ? null : post._id)}
                        className="text-text-primary hover:text-sky-500 transition-colors cursor-pointer"
                        title="Comment"
                      >
                        <MessageCircle className="w-6 h-6 -rotate-90" />
                      </button>

                      {/* Direct Message / Send Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (post.author?._id && !isSelf) {
                            router.push(`/member/inbox?user=${post.author._id}`);
                          } else {
                            handleCopyLink(post._id);
                          }
                        }}
                        className="text-text-primary hover:text-sky-500 transition-colors cursor-pointer"
                        title={!isSelf ? "Message Athlete" : "Share Post"}
                      >
                        <Send className="w-5 h-5 -rotate-45" />
                      </button>
                    </div>

                    {/* Bookmark / Save Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSavePost(post._id)}
                      className="text-text-primary hover:text-amber-500 transition-colors cursor-pointer"
                      title={isSaved ? "Saved" : "Save"}
                    >
                      <Bookmark 
                        className={`w-5 h-5 transition-colors ${
                          isSaved 
                            ? 'text-amber-500 fill-amber-500' 
                            : 'text-text-primary'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* POST CONTENT & CAPTION */}
                  <div className="px-3.5 pb-3 space-y-1.5">
                    {/* Likes Count */}
                    {(post.likes?.length || 0) > 0 && (
                      <p className="text-xs font-semibold text-text-primary">
                        {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                      </p>
                    )}

                    {/* Caption with Handle */}
                    {post.content && (
                      <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                        <button
                          type="button"
                          onClick={() => navigateToProfile(post.author?._id)}
                          className="font-bold mr-1.5 hover:underline cursor-pointer"
                        >
                          {authorHandle}
                        </button>
                        <span>
                          {post.content.split(' ').map((word: string, i: number) => {
                            if (word.startsWith('#')) {
                              return (
                                <span key={i} className="text-sky-600 dark:text-sky-400 font-medium mr-1">
                                  {word}{' '}
                                </span>
                              );
                            }
                            return word + ' ';
                          })}
                        </span>
                      </p>
                    )}

                    {/* View all comments toggle link */}
                    {(post.comments?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedComments(isCommentsOpen ? null : post._id)}
                        className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer block pt-0.5"
                      >
                        {isCommentsOpen 
                          ? "Hide comments" 
                          : `View all ${post.comments.length} ${post.comments.length === 1 ? 'comment' : 'comments'}`}
                      </button>
                    )}

                    {/* Expanded Comment List */}
                    {isCommentsOpen && (
                      <div className="pt-2 space-y-2 border-t border-border/40 mt-2">
                        {post.comments.map((comment: any) => {
                          const cAuthorName = getDisplayName(comment.author);
                          const cHandle = getHandle(comment.author);
                          const isCommentAuthor = comment.author?._id === user?.id || comment.author === user?.id;
                          const canDeleteComment = isCommentAuthor || canDelete;

                          return (
                            <div key={comment._id} className="flex items-start justify-between gap-2 group text-xs">
                              <p className="text-text-primary leading-snug">
                                <span className="font-bold mr-1.5 cursor-pointer hover:underline" onClick={() => navigateToProfile(comment.author?._id || comment.author)}>
                                  {cHandle}
                                </span>
                                <span>{comment.content}</span>
                                <span className="text-[10px] text-text-muted ml-2">
                                  {formatTimeAgo(comment.createdAt)}
                                </span>
                              </p>

                              {canDeleteComment && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(post._id, comment._id)}
                                  className="text-text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* INLINE COMMENT INPUT (Instagram Add a comment...) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[post._id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit(post._id);
                          }
                        }}
                        className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                      />
                      {commentInputs[post._id]?.trim() && (
                        <button
                          type="button"
                          onClick={() => handleCommentSubmit(post._id)}
                          className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors cursor-pointer"
                        >
                          Post
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDEBAR: Instagram "Suggested for you" (Desktop)
         ======================================================== */}
      <aside className="hidden lg:block w-[310px] xl:w-[340px] shrink-0 space-y-5 pt-2">
        
        {/* 1. Logged-in User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push('/member/profile')}
              className="w-11 h-11 rounded-full p-[1.5px] bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="w-full h-full rounded-full border border-background overflow-hidden bg-surface flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                {user?.avatar ? (
                  <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
            </button>

            <div className="min-w-0">
              <button
                type="button"
                onClick={() => router.push('/member/profile')}
                className="font-bold text-xs text-text-primary hover:underline truncate block text-left"
              >
                {getHandle(user)}
              </button>
              <p className="text-xs text-text-muted truncate">
                {user?.name || "FitCore Athlete"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/member/profile')}
            className="text-xs font-semibold text-sky-500 hover:text-sky-600 cursor-pointer"
          >
            Profile
          </button>
        </div>

        {/* 2. "Suggested for you" Header */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text-muted">
              Suggested for you
            </span>
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className="text-xs font-semibold text-text-primary hover:text-sky-500 cursor-pointer"
            >
              See all
            </button>
          </div>

          {/* List of Suggested Athletes & Coaches */}
          <div className="space-y-3">
            {featuredAthletes.slice(0, 5).map((athlete: any) => {
              const handle = getHandle(athlete);
              const displayName = getDisplayName(athlete);
              const initial = getDisplayInitial(athlete);
              const isCoach = athlete.role === 'coach';
              const isFollowing = (athlete.followers || []).includes(user?.id);

              return (
                <div key={athlete._id} className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => navigateToProfile(athlete._id)}
                      className="w-9 h-9 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0 cursor-pointer hover:scale-105 transition-transform"
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
                          className="font-semibold text-xs text-text-primary hover:underline truncate text-left cursor-pointer"
                        >
                          {handle}
                        </button>
                        {isCoach && (
                          <span title="Verified Coach">
                            <BadgeCheck className="w-3 h-3 text-emerald-500 fill-emerald-500/20 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {isCoach ? 'FitCore Coach' : 'Suggested for you'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(athlete._id)}
                    disabled={isFollowLoading}
                    className={`text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      isFollowing 
                        ? 'text-text-muted hover:text-rose-500' 
                        : 'text-sky-500 hover:text-sky-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Active Challenges Feature Card */}
        <div className="p-3.5 rounded-2xl bg-surface/70 border border-border/70 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Active Challenges
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              Join
            </span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Compete in weekly workout &amp; PR challenges to win fitness badges!
          </p>
          <Link
            href="/member/community/challenges"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
          >
            <span>Explore challenges</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* 4. Instagram Footer Meta Links */}
        <div className="px-1 pt-3 space-y-3 text-[11px] text-text-muted/70">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <Link href="/about" className="hover:underline">About</Link>
            <span>•</span>
            <Link href="/contact" className="hover:underline">Help</Link>
            <span>•</span>
            <Link href="/member/community/challenges" className="hover:underline">Challenges</Link>
            <span>•</span>
            <Link href="/member/workouts" className="hover:underline">Workouts</Link>
            <span>•</span>
            <span className="cursor-default">Privacy</span>
            <span>•</span>
            <span className="cursor-default">Terms</span>
            <span>•</span>
            <span className="cursor-default">Locations</span>
          </div>

          <p className="uppercase text-[10px] tracking-wider text-text-muted/60">
            &copy; 2026 FITCORE FROM FITNESS TECH
          </p>
        </div>
      </aside>

      {/* ========================================================
          FLOATING MESSAGES BUTTON (Bottom Right - Exactly like Instagram)
         ======================================================== */}
      <Link
        href="/member/inbox"
        className="fixed bottom-6 right-6 z-40 bg-surface/95 dark:bg-[#18181b]/95 backdrop-blur-md text-text-primary border border-border shadow-xl rounded-full px-4 py-2.5 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs font-bold group"
      >
        <Send className="w-4 h-4 text-sky-500 -rotate-45 group-hover:translate-x-0.5 transition-transform" />
        <span>Messages</span>
        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
      </Link>

      {/* Delete Post Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
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
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePost}
                disabled={isDeletingPost}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isDeletingPost ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
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
