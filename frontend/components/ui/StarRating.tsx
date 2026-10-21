"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  isInteractive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 20, 
  isInteractive = false,
  onRatingChange 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const displayRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex gap-1" onMouseLeave={() => isInteractive && setHoverRating(0)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        const isHalf = !isFilled && starValue - 0.5 <= displayRating;

        return (
          <motion.button
            key={i}
            type="button"
            disabled={!isInteractive}
            whileHover={isInteractive ? { scale: 1.2 } : {}}
            whileTap={isInteractive ? { scale: 0.9 } : {}}
            onMouseEnter={() => isInteractive && setHoverRating(starValue)}
            onClick={() => isInteractive && onRatingChange?.(starValue)}
            className={`${isInteractive ? 'cursor-pointer' : 'cursor-default'} transition-colors duration-200`}
          >
            <Star 
              size={size} 
              className={`
                ${isFilled ? 'fill-accent text-accent' : 
                  isHalf ? 'fill-accent/50 text-accent' : 'fill-transparent text-border'}
              `} 
            />
          </motion.button>
        );
      })}
    </div>
  );
}
