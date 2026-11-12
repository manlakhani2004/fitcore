"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Activity, ArrowRight, CheckCircle2, ChevronRight, 
  Dumbbell, HeartPulse, LineChart, ShieldCheck, 
  Star, Users, Zap 
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FitCoreLogo } from "@/components/ui/FitCoreLogo";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <FitCoreLogo size="sm" badgeText="v2.0" href="/" />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-text-muted">
            <Link href="/" className="text-primary transition-colors">Home</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-semibold text-text-primary hover:text-primary transition-colors hidden sm:block">
              Log In
            </Link>
            <Link href="/register">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm">
                Start Free Trial
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
        {/* Background Video (Indian Fitness, Diet, and Workout) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 bg-[#0A0A0F]">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          >
            <source src="/bg-indian-gym.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50 z-0" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border mb-8"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-xs font-bold text-text-muted">FitCore v2.0 is now live</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Forge Your Core.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Own Your Journey.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10"
          >
            The ultimate platform connecting ambitious members with elite trainers. 
            Track workouts, log meals, and crush your goals in one premium experience.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(108,99,255,0.5)]">
                Get Started Now <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="#how-it-works">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface hover:bg-background border border-border px-8 py-4 rounded-full font-bold text-lg text-text-primary transition-all">
                Learn More
              </button>
            </Link>
          </motion.div>

          {/* Floating Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-t-2xl md:rounded-t-[40px] border-t border-l border-r border-border bg-surface p-2 md:p-4 shadow-2xl overflow-hidden">
              <div className="aspect-[16/9] w-full bg-background rounded-xl md:rounded-3xl border border-border overflow-hidden relative flex items-center justify-center">
                 {/* Dashboard Preview Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                 <div className="text-center space-y-4 relative z-10">
                    <Activity className="w-16 h-16 text-primary mx-auto opacity-50" />
                    <p className="font-display font-bold text-xl text-text-muted">Interactive Dashboard Preview</p>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface border-y border-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Everything you need to succeed</h2>
            <p className="text-text-muted text-lg">We stripped away the fluff to give you powerful tools that actually drive results.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: Dumbbell, title: "Workout Tracking", desc: "Log sets, reps, and rest times with our intuitive interface. Never lose track of your progress." },
              { icon: Activity, title: "Macro Management", desc: "Detailed nutritional logging with visual macro gauges to ensure you hit your targets daily." },
              { icon: LineChart, title: "Advanced Analytics", desc: "Watch your body transform with beautiful, interactive charts tracking weight, body fat, and measurements." },
              { icon: Users, title: "Expert Coaching", desc: "Connect with world-class trainers for personalized programming, form checks, and accountability." },
              { icon: Zap, title: "Goal Tracking", desc: "Set custom goals, stay consistent, and monitor your daily achievements with precision." },
              { icon: HeartPulse, title: "Community Feed", desc: "Share your wins, post progress photos, and get inspired by others on the same journey." }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="bg-background border border-border p-8 rounded-3xl group transition-all hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(108,99,255,0.1)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <feat.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-text-muted leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Your journey, simplified.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent -z-10" />

            {[
              { step: "01", title: "Join the Platform", desc: "Create your free account and set your baseline fitness goals." },
              { step: "02", title: "Get Matched", desc: "Find the perfect coach or start following our built-in training plans." },
              { step: "03", title: "Transform", desc: "Log your daily metrics, hit your macros, and watch your body change." }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative text-center"
              >
                <div className="w-20 h-20 mx-auto bg-surface border border-border rounded-full flex items-center justify-center font-display font-bold text-2xl text-primary mb-6 shadow-xl relative z-10">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-text-muted max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 bg-surface border-y border-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Invest in yourself</h2>
            <p className="text-text-muted text-lg">Simple, transparent pricing. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-background border border-border p-8 rounded-3xl flex flex-col relative">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display font-bold">₹0</span>
                <span className="text-text-muted">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Basic workout logging', 'Community access', 'Global leaderboard'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-muted">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <button disabled className="w-full py-3 rounded-full border border-border font-bold bg-surface opacity-70 cursor-not-allowed">
                Current Plan
              </button>
            </div>

            {/* Pro */}
            <div className="bg-background border-2 border-primary p-8 rounded-3xl flex flex-col relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(108,99,255,0.15)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Pro Training</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display font-bold">₹19</span>
                <span className="text-text-muted">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Advanced analytics', 'Custom macro goals', 'Private coach matching', 'Priority support'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-primary">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full">
                <button className="w-full py-3 rounded-full bg-primary hover:bg-primary-hover text-white font-bold transition-colors">
                  Start 7-Day Trial
                </button>
              </Link>
            </div>

            {/* Elite */}
            <div className="bg-background border border-border p-8 rounded-3xl flex flex-col relative">
              <h3 className="text-xl font-bold mb-2">Elite Plus</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display font-bold">₹49</span>
                <span className="text-text-muted">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Everything in Pro', 'Unlimited 1-on-1 coaching', 'Custom meal plans', 'Weekly video check-ins'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-muted">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full">
                <button className="w-full py-3 rounded-full border border-border font-bold hover:bg-surface transition-colors">
                  Choose Elite
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">Ready to forge your core?</h2>
          <p className="text-xl text-text-muted mb-10">Join thousands of members already transforming their lives.</p>
          <Link href="/register">
            <button className="bg-primary hover:bg-primary-hover text-white px-10 py-5 rounded-full font-bold text-xl transition-all hover:shadow-[0_0_40px_rgba(108,99,255,0.6)] animate-pulse">
              Start Your Free Trial
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="font-display font-bold text-3xl tracking-tight mb-4">
                Fit<span className="text-primary">Core</span>
              </div>
              <p className="text-text-muted max-w-sm mb-6">
                Forge Your Core. Own Your Journey. The ultimate platform for serious fitness tracking and coaching.
              </p>
              <div className="flex items-center gap-4 text-text-muted">
                {/* Social placeholders */}
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer">X</div>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer">IG</div>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer">YT</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-text-muted">
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Coaches</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-text-muted">
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-text-muted">
            &copy; {new Date().getFullYear()} FitCore Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
