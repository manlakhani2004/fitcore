"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Send, MessageCircle } from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

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

export default function CommunityPage() {
  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/community/posts');
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
    fetchPosts();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const res = await api.post('/community/posts', {
        content: newPostContent
      });
      if (res.data.success) {
        toast.success("Posted successfully!");
        setNewPostContent("");
        fetchPosts(); // Refresh posts
      }
    } catch (err) {
      toast.error("Failed to create post");
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const res = await api.post(`/community/posts/${postId}/comments`, { content });
      if (res.data.success) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchPosts(); // Refresh posts to show new comment
      }
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await api.post(`/community/posts/${postId}/like`);
      fetchPosts(); // Note: for better UX, optimistic update is preferred, but simple fetch works
    } catch (err) {
      console.error('Failed to like post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Community Feed</h1>
        <p className="text-text-muted mt-1">Share your progress and hype up others.</p>
      </div>

      {/* Post Creator */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl p-6 border border-border"
      >
        <form onSubmit={handlePostSubmit}>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <textarea 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your latest workout, milestone, or training win..."
              className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none h-24"
            />
          </div>
          <div className="flex justify-between items-center mt-4 pl-14">
            <button type="button" className="text-text-muted hover:text-primary transition-colors p-2">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              disabled={!newPostContent.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              Post <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-surface rounded-3xl border border-border p-8">
            <p className="text-sm font-semibold text-text-primary">No community posts yet.</p>
            <p className="text-xs text-text-muted mt-1">Be the first to share your workout or milestone above!</p>
          </div>
        )}

        <AnimatePresence>
          {posts.map(post => {
            const authorName = getDisplayName(post.author);
            const authorInitial = getDisplayInitial(post.author);

            return (
              <motion.div 
                key={post._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm"
              >
                {/* Post Header */}
                <div className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                    {post.author?.avatar ? (
                      <img src={post.author.avatar} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{authorInitial}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary tracking-tight leading-snug">{authorName}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-4">
                  <p className="text-text-primary leading-relaxed text-sm whitespace-pre-line">{post.content}</p>
                </div>

                {/* Optional Image */}
                {post.imageUrl && (
                  <div className="px-6 pb-4">
                    <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto rounded-2xl border border-border" />
                  </div>
                )}

                {/* Engagement Bar */}
                <div className="px-6 py-4 border-t border-border flex items-center gap-6">
                  <div onClick={() => handleToggleLike(post._id)}>
                    <LikeButton initialLikes={post.likes?.length || 0} />
                  </div>
                  <button 
                    onClick={() => setExpandedComments(expandedComments === post._id ? null : post._id)}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors p-2 rounded-full"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">{post.comments?.length || 0}</span>
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
                        {post.comments?.map((c: any) => {
                          const commentAuthorName = getDisplayName(c.author);
                          const commentInitial = getDisplayInitial(c.author);

                          return (
                            <div key={c._id} className="flex gap-3 items-start">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden mt-0.5">
                                {c.author?.avatar ? (
                                  <img src={c.author.avatar} alt={commentAuthorName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{commentInitial}</span>
                                )}
                              </div>
                              <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-2.5 max-w-lg shadow-sm">
                                <span className="font-semibold text-xs text-text-primary block mb-1">{commentAuthorName}</span>
                                <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{c.content}</span>
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
                              className="w-full bg-surface border border-border rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                            />
                            <button 
                              onClick={() => handleCommentSubmit(post._id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover p-1"
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
    </div>
  );
}
