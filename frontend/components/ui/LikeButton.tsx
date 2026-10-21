"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

interface LikeButtonProps {
  initialLikes: number;
  isLikedInitial?: boolean;
}

export function LikeButton({ initialLikes, isLikedInitial = false }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(isLikedInitial);
  const [likesCount, setLikesCount] = useState(initialLikes);

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <motion.button
      onClick={toggleLike}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center gap-2 p-2 rounded-full transition-colors ${
        isLiked ? 'text-danger bg-danger/10' : 'text-text-muted hover:text-danger hover:bg-danger/10'
      }`}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
      </motion.div>
      <span className="text-sm font-bold">{likesCount}</span>
    </motion.button>
  );
}
