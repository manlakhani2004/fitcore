"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Send, MessageCircle } from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

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
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <textarea 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your latest workout or achievement..."
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
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              Post <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* Feed */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map(post => (
            <motion.div 
              key={post._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-3xl border border-border overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
                  {post.author?.firstName ? post.author.firstName.charAt(0) : '?'}
                </div>
                <div>
                  <h3 className="font-bold">{post.author?.firstName} {post.author?.lastName}</h3>
                  <p className="text-xs text-text-muted">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <p className="text-text-primary leading-relaxed">{post.content}</p>
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
                      {post.comments?.map((c: any) => (
                        <div key={c._id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold shrink-0">
                            {c.author?.firstName ? c.author.firstName.charAt(0) : '?'}
                          </div>
                          <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-2">
                            <span className="font-bold text-xs block mb-1">{c.author?.firstName} {c.author?.lastName}</span>
                            <span className="text-sm">{c.content}</span>
                          </div>
                        </div>
                      ))}

                      {/* Add Comment Input */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                         <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 relative">
                            <input 
                              type="text" 
                              value={commentInputs[post._id] || ""}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                              placeholder="Write a comment..."
                              className="w-full bg-surface border border-border rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
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
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
