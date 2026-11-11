"use client";

import { useState, useEffect, useRef } from "react";
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
  Dumbbell, 
  Activity, 
  Calendar, 
  Users, 
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

type FeedTab = "all" | "following" | "me";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post Actions Menu State
  const [openActionPostId, setOpenActionPostId] = useState<string | null>(null);

  // Delete Post Modal State
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Athlete Profile Modal State
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }

    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        fetchPosts(activeTab); // Refresh posts
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Unable to publish post. Please try again.";
      toast.error(errorMsg, { id: 'post-error' });
    } finally {
      setIsPosting(false);
    }
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
        const { isFollowing, followersCount, message } = res.data;
        toast.success(message);

        // Update profile modal state if open
        if (profileData && profileData.user._id === targetUserId) {
          setProfileData((prev: any) => ({
            ...prev,
            user: {
              ...prev.user,
              isFollowing,
              followersCount
            }
          }));
        }

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

  // Open Athlete Profile Modal
  const openProfileModal = async (authorId: string) => {
    if (!authorId) return;
    setProfileModalUserId(authorId);
    setIsLoadingProfile(true);
    try {
      const res = await api.get(`/community/users/${authorId}/profile`);
      if (res.data.success) {
        setProfileData(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load athlete profile.");
      setProfileModalUserId(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const closeProfileModal = () => {
    setProfileModalUserId(null);
    setProfileData(null);
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
        fetchPosts(activeTab); // Refresh posts to show new comment
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to add comment. Please try again.");
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await api.post(`/community/posts/${postId}/like`);
      // Optimistic count toggle or fetch
      setPosts((prev) =>
        prev.map((p) => {
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
      console.error('Failed to like post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-text-primary">Community Feed</h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">Connect with athletes, log milestones, and share training wins.</p>
        </div>

        {/* Feed Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border shadow-sm">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => handleTabChange('following')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'following'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Following</span>
          </button>
          <button
            onClick={() => handleTabChange('me')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'me'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            My Posts
          </button>
        </div>
      </div>

      {/* Post Creator */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl p-6 border border-border shadow-sm"
      >
        <form onSubmit={handlePostSubmit}>
          <div className="flex gap-4">
            <div 
              onClick={() => openProfileModal(user?.id || '')}
              className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-500/30 transition-all"
              title="View your profile"
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <textarea 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your latest workout, milestone, or training win..."
              className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none h-24 text-text-primary placeholder:text-text-muted"
            />
          </div>

          {/* Image Attachment Preview */}
          {previewUrl && (
            <div className="mt-3 pl-14 relative inline-block group">
              <div className="relative rounded-2xl overflow-hidden border border-border max-w-sm max-h-60 bg-black/5 dark:bg-black/20 shadow-sm">
                <img 
                  src={previewUrl} 
                  alt="Selected preview" 
                  className="w-full h-auto max-h-60 object-cover" 
                />
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-sm transition-transform active:scale-90 shadow-md cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-1 font-medium">
                {selectedImage?.name} • {((selectedImage?.size || 0) / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pl-14">
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageSelect} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer"
              title="Attach a photo"
            >
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <span>{selectedImage ? "Change Photo" : "Photo"}</span>
            </button>

            <button 
              type="submit"
              disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <span>Post</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Feed Stream */}
      <div className="space-y-6">
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
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
                      onClick={() => openProfileModal(post.author?._id)}
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
                          onClick={() => openProfileModal(post.author?._id)}
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
                            openProfileModal(post.author?._id);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5 text-text-muted" />
                          <span>View Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(post._id)}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-text-muted" />
                          <span>Copy Link</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeletePostClick(post._id)}
                            className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 border-t border-border mt-1 pt-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Post</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                {post.content && (
                  <div className="px-6 py-2">
                    <p className="text-text-primary leading-relaxed text-sm whitespace-pre-line">{post.content}</p>
                  </div>
                )}

                {/* Optional Image */}
                {post.imageUrl && (
                  <div className="px-6 py-2">
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
                                onClick={() => openProfileModal(c.author?._id)}
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
                                    onClick={() => openProfileModal(c.author?._id)}
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
                              className="w-full bg-surface border border-border rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary placeholder:text-text-muted"
                            />
                            <button 
                              onClick={() => handleCommentSubmit(post._id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover p-1 cursor-pointer"
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

      {/* Delete Post Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-text-primary">Delete Post?</h3>
                <p className="text-xs text-text-muted">
                  Are you sure you want to remove this post from the community feed? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPostToDelete(null)}
                  disabled={isDeletingPost}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePost}
                  disabled={isDeletingPost}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
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

      {/* Athlete Profile Modal */}
      <AnimatePresence>
        {profileModalUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={closeProfileModal}
                className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {isLoadingProfile && (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                  <p className="text-xs text-text-muted">Loading athlete profile...</p>
                </div>
              )}

              {!isLoadingProfile && profileData && (
                <div className="space-y-6">
                  {/* Top Profile Card */}
                  <div className="flex flex-col items-center text-center space-y-3 pt-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 p-[2px] shadow-lg shadow-indigo-500/20">
                      <div className="w-full h-full rounded-full bg-surface overflow-hidden flex items-center justify-center font-bold text-2xl text-indigo-600 dark:text-white">
                        {profileData.user.avatar ? (
                          <img src={formatImageUrl(profileData.user.avatar)} alt={profileData.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{profileData.user.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">{profileData.user.name}</h2>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded capitalize">
                          {profileData.user.role}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Member since {new Date(profileData.user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {profileData.user.bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed italic">
                        &quot;{profileData.user.bio}&quot;
                      </p>
                    )}

                    {/* Follow Action Button */}
                    {!profileData.user.isSelf ? (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(profileData.user._id)}
                        disabled={isFollowLoading}
                        className={`px-6 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          profileData.user.isFollowing
                            ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-white/[0.08] dark:hover:bg-rose-500/10 dark:text-slate-300 dark:hover:text-rose-400 border border-border'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        }`}
                      >
                        {profileData.user.isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow Athlete</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-text-muted border border-border">
                        Your Profile
                      </span>
                    )}
                  </div>

                  {/* Follower Stats Row */}
                  <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-background border border-border">
                    <div>
                      <p className="text-base font-bold font-mono text-text-primary">{profileData.user.followersCount || 0}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Followers</p>
                    </div>
                    <div>
                      <p className="text-base font-bold font-mono text-text-primary">{profileData.user.followingCount || 0}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Following</p>
                    </div>
                    <div>
                      <p className="text-base font-bold font-mono text-text-primary">{profileData.metrics.totalWorkouts || 0}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Workouts</p>
                    </div>
                    <div>
                      <p className="text-base font-bold font-mono text-text-primary">{profileData.metrics.totalPosts || 0}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Posts</p>
                    </div>
                  </div>

                  {/* Fitness Goals */}
                  {profileData.profile?.fitnessGoals?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                        Focus Areas & Goals
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profileData.profile.fitnessGoals.map((g: string) => (
                          <span 
                            key={g}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 capitalize"
                          >
                            {g.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Athlete Activity */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                      Recent Activity ({profileData.recentPosts?.length || 0})
                    </span>
                    {profileData.recentPosts?.length === 0 ? (
                      <p className="text-xs text-text-muted italic">No recent posts from this athlete.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {profileData.recentPosts.map((rp: any) => (
                          <div 
                            key={rp._id} 
                            className="p-3 rounded-xl bg-background border border-border space-y-1.5 text-left"
                          >
                            <div className="flex items-center justify-between text-[10px] text-text-muted">
                              <span>{new Date(rp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              <span className="flex items-center gap-1">❤️ {rp.likes?.length || 0}</span>
                            </div>
                            {rp.content && <p className="text-xs text-text-primary line-clamp-2">{rp.content}</p>}
                            {rp.imageUrl && (
                              <img 
                                src={formatImageUrl(rp.imageUrl)} 
                                alt="Thumbnail" 
                                className="w-full h-24 object-cover rounded-lg border border-border" 
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
