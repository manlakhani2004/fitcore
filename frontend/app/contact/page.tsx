"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden selection:bg-primary/30 selection:text-primary pt-20">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="font-display font-bold text-2xl tracking-tight cursor-pointer">
              Fit<span className="text-primary">Core</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-text-muted">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="text-primary transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-text-primary hover:text-primary transition-colors hidden sm:block">
              Log In
            </Link>
            <Link href="/register">
              <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(108,99,255,0.4)]">
                Start Free Trial
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-20 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-display font-bold mb-4"
            >
              Get in Touch
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-text-muted text-lg"
            >
              Have a question about FitCore, need technical support, or want to explore partnership opportunities? We're here to help.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border p-8 rounded-3xl shadow-xl"
            >
              {status === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary">Message Sent!</h3>
                  <p className="text-text-muted">Thanks for reaching out. A member of the FitCore team will get back to you within 24 hours.</p>
                  <button onClick={() => setStatus('idle')} className="mt-4 px-6 py-2 bg-background border border-border rounded-full hover:border-primary transition-colors">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-text-muted mb-2">First Name</label>
                      <input required type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-muted mb-2">Last Name</label>
                      <input required type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Email Address</label>
                    <input required type="email" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Subject</label>
                    <select className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-text-primary">
                      <option>General Inquiry</option>
                      <option>Technical Support</option>
                      <option>Billing Question</option>
                      <option>Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Message</label>
                    <textarea required rows={5} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none" placeholder="How can we help you?" />
                  </div>
                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-70"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-display font-bold mb-6">Contact Information</h3>
                <p className="text-text-muted mb-8">Our support team is distributed globally to ensure you get help whenever you need it.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Email Us</h4>
                    <p className="text-sm text-text-muted mb-1">For general support and questions.</p>
                    <a href="mailto:support@fitcore.app" className="text-primary hover:underline font-bold">support@fitcore.app</a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Headquarters</h4>
                    <p className="text-sm text-text-muted mb-1">FitCore Technologies Inc.</p>
                    <p className="text-sm text-text-muted">123 Fitness Ave, Suite 400<br/>San Francisco, CA 94105</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border pt-12 pb-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} FitCore Technologies Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
