"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Award, Calendar as CalendarIcon, Clock, CheckCircle2, Loader2, Star, MessageSquare, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { StarRating } from "@/components/ui/StarRating";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { CheckoutModal } from "@/components/CheckoutModal";

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const isValidId = /^[a-f\d]{24}$/i.test(id);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [coach, setCoach] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [assignedCoachId, setAssignedCoachId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Flow Separation States
  const [activeTab, setActiveTab] = useState<'hire' | 'book'>('hire');
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!isValidId) { setIsLoading(false); return; }
    const fetchData = async () => {
      try {
        const [coachRes, reviewsRes, assignRes] = await Promise.allSettled([
          api.get(`/coaches/${id}`),
          api.get(`/coaches/${id}/reviews`),
          api.get('/users/my-coach').catch(() => ({ data: { success: false } }))
        ]);
        if (coachRes.status === 'fulfilled' && coachRes.value.data.success) setCoach(coachRes.value.data.data);
        if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data.success) setReviews(reviewsRes.value.data.data);
        if (assignRes.status === 'fulfilled' && assignRes.value.data?.success) setAssignedCoachId(assignRes.value.data.data.coachId?._id);
      } catch (err) {
        console.error("Failed to fetch coach", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const date = new Date();
        date.setDate(date.getDate() + ((selectedDay + 7 - date.getDay()) % 7));
        const dateStr = date.toISOString().split('T')[0];
        const res = await api.get(`/appointments/available-slots/${id}/${dateStr}`);
        if (res.data.success) {
          setAvailableSlots(res.data.data.filter((s: any) => !s.isBooked).map((s: any) => s.startTime));
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        setSlotsLoading(false);
      }
    };
    if (isValidId) fetchSlots();
  }, [id, selectedDay]);

  const handleBookingConfirm = async () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    try {
      const date = new Date();
      date.setDate(date.getDate() + ((selectedDay + 7 - date.getDay()) % 7));
      const [startH, startM] = selectedSlot.split(':').map(Number);
      const endH = String((startH + 1) % 24).padStart(2, '0');
      const endM = String(startM || 0).padStart(2, '0');
      await api.post('/appointments/book', {
        coachId: id,
        date: date.toISOString().split('T')[0],
        startTime: selectedSlot,
        endTime: `${endH}:${endM}`,
        type: 'online'
      });
      toast.success("Appointment Confirmed!");
      setSelectedSlot(null);
    } catch (err) {
      toast.error("Booking failed. Slot might be taken.");
      throw err;
    }
  };

  const handleHireConfirm = async () => {
    try {
      const res = await api.put('/users/my-coach', { coachId: id });
      if (res.data.success) {
        setAssignedCoachId(id);
        toast.success(`${coach.userId?.name} is now your personal coach!`);
      }
    } catch { toast.error('Failed to set coach'); }
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) return toast.error("Please write a comment");
    setSubmittingReview(true);
    try {
      const res = await api.post(`/coaches/${id}/review`, { rating: reviewRating, comment: reviewComment });
      if (res.data.success) {
        toast.success("Review submitted!");
        setReviews(prev => [...prev, { ...res.data.data, memberId: { name: "You" } }]);
        setShowReviewForm(false);
        setReviewComment("");
        setReviewRating(5);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!coach) {
    return <div className="text-center p-10 text-text-muted">Coach not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <Link href="/member/coaches" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Coaches
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl border border-border overflow-hidden relative shadow-sm">
        <div className="h-48 bg-gradient-to-r from-primary/30 to-accent/20 relative">
          <div className="absolute inset-0 bg-background/20" />
        </div>
        <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end -mt-16">
          <div className="w-32 h-32 rounded-3xl border-4 border-surface bg-background flex items-center justify-center text-4xl font-bold text-primary shadow-xl">
            {coach.userId?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold flex items-center gap-2">
                  {coach.userId?.name || 'Coach'} <CheckCircle2 className="w-5 h-5 text-accent" />
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Online & Local</span>
                  <span className="flex items-center gap-1">
                    <StarRating rating={coach.averageRating || 0} maxRating={5} size={14} />
                    ({coach.totalReviews || 0} Reviews)
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-3xl font-mono font-bold text-primary">₹{coach.hourlyRate || 0}</div>
                <div className="text-sm text-text-muted">per session</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {(coach.specializations || []).map((spec: string) => (
                <span key={spec} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-md text-xs font-medium">{spec}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-surface p-8 rounded-3xl border border-border">
            <h2 className="text-xl font-display font-bold mb-4">About Me</h2>
            <p className="text-text-muted leading-relaxed">{coach.bio || 'No bio provided.'}</p>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-surface p-8 rounded-3xl border border-border">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" /> Certifications
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(coach.certifications || []).map((cert: any, i: number) => (
                <div key={i} className="bg-background border border-border p-4 rounded-2xl flex items-start gap-4 hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">{cert.name}</h4>
                    <p className="text-xs text-text-muted mt-1">{cert.issuer}</p>
                    <p className="text-xs text-primary mt-1 font-mono">{cert.year}</p>
                  </div>
                </div>
              ))}
              {(!coach.certifications || coach.certifications.length === 0) && (
                <p className="text-text-muted text-sm">No certifications listed.</p>
              )}
            </div>
          </motion.section>

          {/* Reviews Section */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-surface p-8 rounded-3xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" /> Reviews ({reviews.length})
              </h2>
              <button onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-sm font-bold text-primary hover:underline">
                {showReviewForm ? "Cancel" : "Write a Review"}
              </button>
            </div>

            {showReviewForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="bg-background border border-border rounded-2xl p-5 mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewRating(n)} className="transition-transform hover:scale-110">
                        <Star className={`w-6 h-6 ${n <= reviewRating ? 'text-accent fill-accent' : 'text-text-muted'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2">Comment</label>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Share your experience with this coach..." />
                </div>
                <button onClick={submitReview} disabled={submittingReview}
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-70">
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Submit Review
                </button>
              </motion.div>
            )}

            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div key={review._id || idx} className="bg-background border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {review.memberId?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{review.memberId?.name || 'Anonymous'}</h4>
                      <StarRating rating={review.rating} maxRating={5} size={12} />
                    </div>
                    <span className="ml-auto text-xs text-text-muted">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-text-muted">{review.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && !showReviewForm && (
                <p className="text-text-muted text-sm text-center py-4">No reviews yet. Be the first!</p>
              )}
            </div>
          </motion.section>
        </div>

        {/* Right Column: Workflows */}
        <div className="lg:col-span-1">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-surface p-6 rounded-3xl border border-border sticky top-24">
            
            <div className="flex gap-2 p-1 bg-background border border-border rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab('hire')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'hire' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
              >
                Hire Coach
              </button>
              <button 
                onClick={() => setActiveTab('book')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'book' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
              >
                Book Session
              </button>
            </div>

            {activeTab === 'hire' ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <UserPlus className="w-12 h-12 text-primary mx-auto mb-2 opacity-80" />
                  <h3 className="text-xl font-display font-bold">Personal Coach</h3>
                  <p className="text-sm text-text-muted mt-1">Get ongoing support, custom programs, and diet plans.</p>
                </div>
                
                <div className="bg-background border border-border rounded-xl p-5 mb-6 text-center">
                  <span className="text-3xl font-mono font-bold text-primary">₹{coach.monthlyRate || 150}</span>
                  <span className="text-sm text-text-muted"> / month</span>
                </div>

                <ul className="space-y-3 text-sm text-text-muted mb-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Custom Workout Programs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Personalized Diet Plans</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Daily Tasks & Habit Tracking</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Unlimited Direct Messaging</li>
                </ul>

                <button 
                  onClick={() => setShowCheckout(true)} 
                  disabled={assignedCoachId === id}
                  className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    assignedCoachId === id
                      ? 'bg-accent/10 text-accent border border-accent/30 cursor-default'
                      : 'bg-primary hover:bg-primary-hover text-white hover:shadow-primary/30 hover:-translate-y-1'
                  }`}
                >
                  {assignedCoachId === id ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Current Personal Coach
                    </>
                  ) : (
                    'Hire as Personal Coach'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <CalendarIcon className="w-12 h-12 text-primary mx-auto mb-2 opacity-80" />
                  <h3 className="text-xl font-display font-bold">Book a Session</h3>
                  <p className="text-sm text-text-muted mt-1">Schedule a 1-on-1 virtual session for form check or advice.</p>
                </div>

                <div className="flex justify-between mb-6 bg-background rounded-xl p-2 border border-border">
                  {WEEK_DAYS.map((day, i) => {
                    const dateObj = new Date();
                    dateObj.setDate(dateObj.getDate() + ((i + 7 - dateObj.getDay()) % 7));
                    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    return (
                      <button key={day} onClick={() => { setSelectedDay(i); setSelectedSlot(null); }}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors flex-1 ${selectedDay === i ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface'}`}>
                        <span className="text-xs font-bold">{day}</span>
                        <span className="text-[10px] mt-0.5 opacity-80 whitespace-nowrap">{dateStr}</span>
                      </button>
                    );
                  })}
                </div>

                <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Available Times
                </h3>
                {slotsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6 bg-background border border-border rounded-xl">No available slots for this day.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {availableSlots.map((time) => (
                      <button key={time} onClick={() => setSelectedSlot(time)}
                        className={`py-3 rounded-xl text-sm font-mono transition-all border ${
                          selectedSlot === time
                            ? 'bg-accent/10 border-accent text-accent shadow-[0_0_10px_rgba(0,245,160,0.2)] scale-[1.02]'
                            : 'bg-background border-border text-text-primary hover:border-primary/50'
                        }`}>
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-background border border-border rounded-xl p-4 mb-4 flex justify-between items-center">
                  <span className="text-sm text-text-muted">Session Cost</span>
                  <span className="text-xl font-mono font-bold text-primary">₹{coach.hourlyRate || 0}</span>
                </div>

                <button onClick={() => {
                    if (!selectedSlot) return toast.error("Please select a time slot");
                    setShowCheckout(true);
                  }}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0"
                >
                  Book Session
                </button>
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal 
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          type={activeTab}
          amount={activeTab === 'hire' ? (coach.monthlyRate || 150) : (coach.hourlyRate || 0)}
          title={activeTab === 'hire' ? 'Hire Personal Coach' : 'Confirm Appointment'}
          description={activeTab === 'hire' ? `Subscribe to ${coach.userId?.name} as your personal coach.` : `1-hour virtual session with ${coach.userId?.name}.`}
          onConfirm={activeTab === 'hire' ? handleHireConfirm : handleBookingConfirm}
        />
      )}
    </div>
  );
}
