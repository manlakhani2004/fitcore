"use client";

import { useState, useRef } from "react";
import { MoveHorizontal } from "lucide-react";

interface PhotoSliderProps {
  beforeImage: string;
  afterImage: string;
}

export function PhotoSlider({ beforeImage, afterImage }: PhotoSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  const handleMouseDown = () => {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-surface border border-border"
      onMouseDown={handleMouseDown}
      onTouchMove={handleDrag}
    >
      {/* Before Image (Background) */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${beforeImage})` }}
      >
        <span className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-md">
          Day 1
        </span>
      </div>

      {/* After Image (Clipped overlay) */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${afterImage})`,
          clipPath: `inset(0 0 0 ${sliderPosition}%)`
        }}
      >
        <span className="absolute top-4 right-4 bg-primary/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-md">
          Current
        </span>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl text-primary">
          <MoveHorizontal className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
