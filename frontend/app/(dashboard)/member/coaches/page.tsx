"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Filter, SlidersHorizontal, MapPin, Award } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import api from "@/lib/api";
import toast from "react-hot-toast";

const SPECIALIZATIONS = ['All', 'Weight Loss', 'HIIT', 'Boxing', 'Endurance', 'Flexibility', 'Mindset'];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const res = await api.get('/coaches');
        if (res.data.success) {
          setCoaches(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch coaches");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoaches();
  }, []);

  const filteredCoaches = coaches.filter(coach => {
    const matchesFilter = activeFilter === 'All' || (coach.specializations && coach.specializations.includes(activeFilter));
    const nameMatch = coach.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const specMatch = coach.specializations?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && (nameMatch || specMatch);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Find Your Coach</h1>
          <p className="text-text-muted mt-1">Connect with elite professionals to reach your goals.</p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search coaches or specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-surface border border-border rounded-full pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <SlidersHorizontal className="w-5 h-5 text-text-muted shrink-0 mr-2" />
        {SPECIALIZATIONS.map(spec => (
          <motion.button
            key={spec}
            onClick={() => setActiveFilter(spec)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              activeFilter === spec 
                ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(108,99,255,0.4)]' 
                : 'bg-surface border-border text-text-muted hover:border-text-primary hover:text-text-primary'
            }`}
          >
            {spec}
          </motion.button>
        ))}
      </div>

      {/* Coach Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {filteredCoaches.map((coach, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              key={coach._id}
              className="bg-surface border border-border rounded-3xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-col"
            >
              {/* Card Header Background */}
              <div className="h-24 bg-gradient-to-br from-primary/20 to-accent/10 relative">
                <div className="absolute -bottom-10 left-6">
                  <div className="w-20 h-20 rounded-full border-4 border-surface bg-background flex items-center justify-center text-2xl font-bold text-primary shadow-lg overflow-hidden">
                    {coach.userId?.avatar ? (
                      <img src={coach.userId.avatar} alt={coach.userId.name} className="w-full h-full object-cover" />
                    ) : (
                      coach.userId?.name?.charAt(0) || 'C'
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-12 p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display font-bold text-xl">{coach.userId?.name}</h3>
                  <div className="flex items-center gap-1 bg-background px-2 py-1 rounded-md text-xs font-bold border border-border">
                    <StarRating rating={1} maxRating={1} size={14} />
                    {(coach.averageRating || 0).toFixed(1)}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {coach.specializations?.map((spec: string) => (
                    <span key={spec} className="text-xs bg-background border border-border px-2 py-1 rounded text-text-muted flex items-center gap-1">
                      <Award className="w-3 h-3" /> {spec}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-xl font-mono font-bold">₹{coach.hourlyRate}</span>
                    <span className="text-xs text-text-muted">/hr</span>
                  </div>
                  <Link href={`/member/coaches/${coach.userId?._id}`}>
                    <motion.button 
                      whileHover={{ y: -2 }}
                      className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg hover:shadow-primary/30 transition-all"
                    >
                      Book Now
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      {filteredCoaches.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <p className="text-xl font-medium">No coaches found matching your criteria.</p>
          <button onClick={() => {setActiveFilter('All'); setSearchQuery('');}} className="mt-4 text-primary hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
