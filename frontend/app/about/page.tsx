"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Target, Users, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FitCoreLogo } from "@/components/ui/FitCoreLogo";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden selection:bg-primary/30 selection:text-primary pt-20">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <FitCoreLogo size="sm" badgeText="v2.0" href="/" />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-text-muted">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/about" className="text-primary transition-colors">About</Link>
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
      <section className="relative pt-20 pb-20 overflow-hidden border-b border-border">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">FitCore</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-lg md:text-xl text-text-muted mx-auto"
          >
            We believe that fitness is a journey, not a destination. Our mission is to bridge the gap between ambitious individuals and elite professional coaching.
          </motion.p>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Our Core Values</h2>
            <p className="text-text-muted">The principles that drive everything we build.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "Precision", desc: "No guesswork. We rely on data, metrics, and proven methodologies to drive results." },
              { icon: Users, title: "Community", desc: "Fitness is better together. We foster an environment of support, healthy competition, and shared wins." },
              { icon: ShieldCheck, title: "Integrity", desc: "Transparent pricing, authentic coaches, and a platform that truly respects your privacy and data." }
            ].map((value, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-background border border-border p-8 rounded-3xl text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-text-muted">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert prose-lg max-w-none">
            <h2 className="text-3xl font-display font-bold mb-6">Our Story</h2>
            <p className="text-text-muted mb-6">
              FitCore was born out of frustration. We noticed that while there were hundreds of fitness apps on the market, none of them offered a truly cohesive experience that combined rigorous workout tracking, detailed macro management, and direct access to professional coaching in a single, unified platform.
            </p>
            <p className="text-text-muted mb-6">
              You either had to jump between three different apps, or settle for a subpar experience. We decided to build the ultimate solution. 
            </p>
            <p className="text-text-muted">
              Today, FitCore serves thousands of members worldwide, connecting them with world-class trainers and providing the premium tools they need to forge their core and own their journey.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-display font-bold mb-6">Ready to join the movement?</h2>
          <p className="text-lg opacity-90 mb-10">Sign up today and get 7 days of Pro Training absolutely free.</p>
          <Link href="/register">
            <button className="bg-white text-primary px-10 py-4 rounded-full font-bold text-lg hover:bg-background transition-colors shadow-xl shadow-black/20">
              Start Your Free Trial
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} FitCore Technologies Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
