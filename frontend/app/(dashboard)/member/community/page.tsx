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
  UserPlus, 
  UserCheck, 
  Copy, 
  Users, 
  User as UserIcon,
  Sparkles, 
  AlertTriangle,
  Trophy,
  Globe,
  Plus
} from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (PNG, JPG, WebP, etc.)");
      return;
    }

    // Validate file size (max 5MB)
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

  // Remove Selected Image
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

  // Clean up object URL on unmount
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

        // Update post feed follow badges
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

  // Navigate to Dedicated Athlete Profile Page
  const navigateToProfile = (authorId?: string) => {
    if (!authorId) return;
    router.push(`/member/community/profile/${authorId}`);
  };

  // Copy Post Link
  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/member/community#post-${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Post link copied to clipboard!");
    setOpenActionPostId(null);
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

  // Unique community athletes for the Instagram-style story reel
  const featuredAthletes = (() => {
    const athleteMap = new Map<string, any>();
    for (const p of posts) {
      if (p.author?._id && p.author._id !== user?.id && !athleteMap.has(p.author._id)) {
        athleteMap.set(p.author._id, p.author);
      }
    }
    return Array.from(athleteMap.values()).slice(0, 10);
  })();

  const followingCount = user?.following?.length || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      
      {/* 1. PINNED TOP BAR: For You, Following, You */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/70 py-2.5 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 flex items-center justify-between gap-3 shadow-xs">
        {/* Navigation Tabs Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface border border-border shadow-2xs">
          <button
            onClick={() => handleTabChange('all')}
            className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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
            className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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
            className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'me'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>You</span>
          </button>
        </div>

        {/* Right Quick Action: + Post Trigger & Challenges */}
        <div className="flex items-center gap-2">
          {!isComposerExpanded && (
            <button
              type="button"
              onClick={() => {
                setIsComposerExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 60);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Post PR</span>
            </button>
          )}

          <Link
            href="/member/community/challenges"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-surface border border-border hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold text-text-primary transition-all flex items-center gap-1.5 shadow-2xs"
            title="Active Challenges"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Challenges</span>
          </Link>
        </div>
      </div>

      {/* 2. INSTAGRAM-STYLE STORIES / DISCOVER ATHLETES REEL */}
      <div className="py-2.5 overflow-x-auto no-scrollbar flex items-start gap-4 border-b border-border/40 pb-4">
        {/* Story Item 1: Your PR / Share Workout */}
        <div 
          onClick={() => {
            setIsComposerExpanded(true);
            setTimeout(() => textareaRef.current?.focus(), 60);
          }}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
        >
          <div className="relative w-16 h-16 sm:w-17 sm:h-17 rounded-full p-[2px] bg-slate-200 dark:bg-white/10 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full rounded-full border-2 border-surface overflow-hidden bg-surface flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
              {user?.avatar ? (
                <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>
            {/* Blue Plus Badge */}
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-indigo-600 text-white border-2 border-surface flex items-center justify-center shadow-xs">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-text-primary mt-1.5 truncate max-w-[68px] text-center">
            Your PR
          </span>
        </div>

        {/* Athletes & Coaches with Instagram-Style Gradient Story Rings */}
        {featuredAthletes.map((athlete: any) => {
          const athleteName = getDisplayName(athlete);
          const firstName = athleteName.split(' ')[0];
          const initial = getDisplayInitial(athlete);
          const isCoach = athlete.role === 'coach';

          return (
            <div
              key={athlete._id}
              onClick={() => navigateToProfile(athlete._id)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
              title={`View ${athleteName}'s profile`}
            >
              <div className={`relative w-16 h-16 sm:w-17 sm:h-17 rounded-full p-[2.5px] transition-transform group-hover:scale-105 shadow-2xs ${
                isCoach
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500'
                  : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
              }`}>
                <div className="w-full h-full rounded-full border-2 border-surface overflow-hidden bg-surface flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {athlete.avatar ? (
                    <img src={formatImageUrl(athlete.avatar)} alt={athleteName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* Coach Badge Icon */}
                {isCoach && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-600 text-white border-2 border-surface flex items-center justify-center text-[9px] font-bold shadow-xs" title="Verified Coach">
                    ★
                  </div>
                )}
              </div>

              <span className="text-[11px] font-medium text-text-primary mt-1.5 truncate max-w-[70px] text-center">
                {firstName}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. POST CREATOR: COMPACT TRIGGER BAR vs EXPANDED COMPOSER */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden transition-all">
        {!isComposerExpanded ? (
          /* Sleek 1-line Compact Trigger (Instagram / LinkedIn / Threads style) */
          <div 
            onClick={() => {
              setIsComposerExpanded(true);
              setTimeout(() => textareaRef.current?.focus(), 60);
            }}
            className="p-3 sm:p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
              {user?.avatar ? (
                <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>

            <div className="flex-1 bg-background hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-border rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-text-muted transition-colors flex items-center justify-between">
              <span className="truncate">
                What&apos;s your workout win today, {user?.name ? user.name.split(' ')[0] : 'Athlete'}? Share a PR...
              </span>
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 ml-2" />
            </div>

            {/* Quick Photo Upload Button */}
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
              className="p-2.5 rounded-2xl bg-background hover:bg-indigo-500/10 border border-border text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Attach Photo"
            >
              <ImageIcon className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        ) : (
          /* Expanded Full Social Composer */
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 sm:p-6 space-y-4"
          >
            <form onSubmit={handlePostSubmit} className="space-y-4">
              {/* Creator Header: User Avatar, Name & Collapse/Discard Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs overflow-hidden">
                    {user?.avatar ? (
                      <img src={formatImageUrl(user.avatar)} alt={user.name || "You"} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary tracking-tight">
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
                  className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Close composer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Textarea Input */}
              <div className="pt-1">
                <textarea 
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`What's your workout win today, ${user?.name ? user.name.split(' ')[0] : 'Athlete'}? Log a PR, share a routine, or celebrate a milestone...`}
                  maxLength={500}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm sm:text-base text-text-primary placeholder:text-text-muted/60 resize-none min-h-[90px] leading-relaxed p-0 selection:bg-indigo-500/20"
                />
              </div>

              {/* Fitness Milestone Quick Tags Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-border/50">
                <span className="text-[10px] uppercase font-bold text-text-muted shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Quick Tags:
                </span>
                {MILESTONE_TAGS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddTag(item.tag)}
                    className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-background hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-text-muted border border-border/80 transition-all cursor-pointer hover:border-indigo-500/20 active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Image Attachment Preview */}
              {previewUrl && (
                <div className="relative inline-block w-full">
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-black/10 dark:bg-black/30 shadow-sm max-h-72 flex items-center justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Selected preview" 
                      className="w-full h-auto max-h-72 object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white backdrop-blur-md transition-all active:scale-90 shadow-md cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2.5 left-3 text-[11px] text-white/90 font-medium bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                      📷 {selectedImage?.name} • {((selectedImage?.size || 0) / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                      selectedImage
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                        : 'bg-background hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 border-border hover:border-indigo-500/20'
                    }`}
                    title="Attach workout photo"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>{selectedImage ? "Change Photo" : "Add Photo"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Character Counter */}
                  <span className={`text-[11px] font-mono ${
                    newPostContent.length > 450 
                      ? 'text-amber-500 font-bold' 
                      : 'text-text-muted'
                  }`}>
                    {newPostContent.length}/500
                  </span>

                  <button 
                    type="submit"
                    disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Feed Stream */}
      <div className="space-y-6 pt-1">
        {isLoading && (
          <div className="text-center py-12 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs text-text-muted">Loading community posts...</span>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-12 bg-surface rounded-3xl border border-border p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            {activeTab === 'following' ? (
              <>
                <p className="text-sm font-semibold text-text-primary">You are not following any athletes yet.</p>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Explore the &quot;For You&quot; feed and follow fellow community members to see their posts here!
                </p>
                <button
                  onClick={() => handleTabChange('all')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Explore For You Feed
                </button>
              </>
            ) : activeTab === 'me' ? (
              <>
                <p className="text-sm font-semibold text-text-primary">You haven&apos;t shared any posts yet.</p>
                <p className="text-xs text-text-muted">Post your first workout photo or PR milestone above!</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-primary">No community posts yet.</p>
                <p className="text-xs text-text-muted">Be the first to share your workout or milestone above!</p>
              </>
            )}
          </div>
        )}

        <AnimatePresence>
          {posts.map(post => {
            const authorName = getDisplayName(post.author);
            const authorInitial = getDisplayInitial(post.author);
            const isSelf = post.author?._id === user?.id;
            const canDelete = isSelf || user?.role === 'admin';
            const isFollowing = (post.author?.followers || []).includes(user?.id);

            return (
              <motion.div 
                key={post._id}
                id={`post-${post._id}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm"
              >
                {/* Post Header */}
                <div className="p-6 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => navigateToProfile(post.author?._id)}
                      className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm hover:scale-105 transition-transform cursor-pointer"
                      title={`View ${authorName}'s profile`}
                    >
                      {post.author?.avatar ? (
                        <img src={formatImageUrl(post.author.avatar)} alt={authorName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{authorInitial}</span>
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigateToProfile(post.author?._id)}
                          className="font-semibold text-sm text-text-primary tracking-tight leading-snug hover:underline truncate cursor-pointer text-left"
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
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions (Follow Pill & 3-Dots Menu) */}
                  <div className="flex items-center gap-2 relative" data-action-menu>
                    {!isSelf && post.author?._id && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(post.author?._id)}
                        disabled={isFollowLoading}
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                          isFollowing
                            ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-white/[0.08] dark:hover:bg-rose-500/10 dark:text-slate-300 dark:hover:text-rose-400 border border-border'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                        }`}
                        title={isFollowing ? "Unfollow athlete" : "Follow athlete"}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* 3-dots Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionPostId(openActionPostId === post._id ? null : post._id);
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {openActionPostId === post._id && (
                      <div className="absolute right-0 top-9 w-44 rounded-2xl bg-surface border border-border shadow-xl py-1.5 z-20 backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionPostId(null);
                            navigateToProfile(post.author?._id);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-text-muted" />
                          <span>View Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(post._id)}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-text-muted" />
                          <span>Copy Link</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeletePostClick(post._id)}
                            className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 border-t border-border mt-1 pt-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete Post</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                {post.content && (
                  <div className="px-6 pb-4">
                    <p className="text-text-primary leading-relaxed text-sm whitespace-pre-line">{post.content}</p>
                  </div>
                )}

                {/* Optional Image */}
                {post.imageUrl && (
                  <div className="px-6 pb-2">
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

                {/* Comments Section (Accordion) */}
                <AnimatePresence>
                  {expandedComments === post._id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-background/50 border-t border-border"
                    >
                      <div className="p-6 space-y-4">
                        {/* Comments List */}
                        {post.comments?.length === 0 && (
                          <p className="text-xs text-text-muted italic">No comments yet. Start the conversation!</p>
                        )}

                        {post.comments?.map((c: any) => {
                          const commentAuthorName = getDisplayName(c.author);
                          const commentInitial = getDisplayInitial(c.author);
                          const canDeleteComment = c.author?._id === user?.id || post.author?._id === user?.id || user?.role === 'admin';

                          return (
                            <div key={c._id} className="flex gap-3 items-start group">
                              <button
                                type="button"
                                onClick={() => navigateToProfile(c.author?._id)}
                                className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden mt-0.5 cursor-pointer hover:scale-105 transition-transform"
                                title={`View ${commentAuthorName}'s profile`}
                              >
                                {c.author?.avatar ? (
                                  <img src={formatImageUrl(c.author.avatar)} alt={commentAuthorName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{commentInitial}</span>
                                )}
                              </button>
                              <div className="flex-1 bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-2.5 max-w-lg shadow-sm relative">
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => navigateToProfile(c.author?._id)}
                                    className="font-semibold text-xs text-text-primary hover:underline cursor-pointer text-left"
                                  >
                                    {commentAuthorName}
                                  </button>
                                  {canDeleteComment && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(post._id, c._id)}
                                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-rose-500 p-1 transition-opacity cursor-pointer"
                                      title="Delete comment"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed block mt-0.5">{c.content}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Comment Input */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                              onClick={() => handleCommentSubmit(post._id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 p-1 cursor-pointer"
                              title="Send comment"
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
            );
          })}
        </AnimatePresence>
      </div>

      {/* Delete Post Confirmation Dialog Modal */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-text-primary">Delete Post?</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Are you sure you want to remove this post from the community feed? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPostToDelete(null)}
                  disabled={isDeletingPost}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold text-text-primary transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePost}
                  disabled={isDeletingPost}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
