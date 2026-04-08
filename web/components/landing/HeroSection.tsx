'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Cpu, Globe, Wifi, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const typewriterWords = ['Rural India', '600M People', 'Your Community', 'Zero Cost'];

const trustBadges = [
  { icon: Shield, label: 'No data stored' },
  { icon: Cpu, label: 'AI-Powered' },
  { icon: Globe, label: '4 Languages' },
  { icon: Wifi, label: 'Works Offline' },
];

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = typewriterWords[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < currentWord.length) {
      timeout = setTimeout(() => {
        setDisplayed(currentWord.slice(0, displayed.length + 1));
      }, 80);
    } else if (!isDeleting && displayed.length === currentWord.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => {
        setDisplayed(displayed.slice(0, -1));
      }, 50);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setWordIndex((i) => (i + 1) % typewriterWords.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Blue radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] radial-glow pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-36">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* ── Left content ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Google badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-background-card border border-border rounded-full px-4 py-1.5 mb-6"
            >
              <span className="text-sm">🏆</span>
              <span className="text-sm font-medium text-white">Google Solution Challenge 2025</span>
              {/* Google dots */}
              <div className="flex gap-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </motion.div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-4">
              Cancer Screening for
              <br />
              <span className="text-accent min-h-[1.2em] inline-block">
                {displayed}
                <span className="animate-pulse">|</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted leading-relaxed mb-8 max-w-xl">
              Send a WhatsApp photo. Get risk assessment in Hindi in 10 seconds.{' '}
              <span className="text-white font-medium">Free. No app needed.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/scan">
                <Button size="xl" variant="primary" className="group">
                  Try Screening Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="xl" variant="ghost" className="border border-border hover:border-border-light">
                  See How It Works
                </Button>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-sm text-muted"
                >
                  <Icon className="h-4 w-4 text-accent-light" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Right: Phone mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Radial glow behind phone */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-96 rounded-full bg-accent/10 blur-3xl" />
            </div>

            {/* Phone mockup */}
            <div className="relative w-64 h-[520px] rounded-[3rem] border-[6px] border-background-card bg-background-primary shadow-2xl shadow-black/50">
              {/* Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-background-card rounded-full" />

              {/* Screen content */}
              <div className="absolute inset-4 rounded-[2.5rem] bg-background-secondary overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-2 text-xs text-muted border-b border-border">
                  <span>9:41</span>
                  <div className="flex gap-1">
                    <span>●●●</span>
                    <span>WiFi</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* App header */}
                <div className="px-4 py-3 bg-background-card border-b border-border">
                  <div className="text-sm font-bold text-white">JanArogya</div>
                  <div className="text-xs text-success">● AI Ready</div>
                </div>

                {/* Scan preview */}
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <div className="rounded-xl bg-background-card border border-border p-3 text-center">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-xs text-muted">Upload or Take Photo</div>
                  </div>

                  <div className="rounded-xl bg-accent/10 border border-accent/30 p-3">
                    <div className="text-xs font-medium text-accent mb-1">Scan Type</div>
                    <div className="text-xs text-white">Oral Cancer Screening</div>
                  </div>

                  <div className="rounded-xl bg-success/10 border border-success/30 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div>
                        <div className="text-xs font-semibold text-success">LOW RISK</div>
                        <div className="text-xs text-muted">Confidence: 91%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card A: Result */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-8 right-0 bg-background-card rounded-xl border border-success/30 px-4 py-2.5 shadow-xl shadow-black/30"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <div>
                  <div className="text-xs font-bold text-success">LOW RISK</div>
                  <div className="text-xs text-muted">Confidence 91%</div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card B: Speed */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute left-0 top-1/3 bg-background-card rounded-xl border border-border px-4 py-2.5 shadow-xl shadow-black/30"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <div>
                  <div className="text-xs font-bold text-white">Analysis: 2.3s</div>
                  <div className="text-xs text-muted">Gemini Vision</div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card C: Languages */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute bottom-16 right-0 bg-background-card rounded-xl border border-border px-4 py-2.5 shadow-xl shadow-black/30"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent-light" />
                <div>
                  <div className="text-xs font-bold text-white">EN · HI · TA · TE</div>
                  <div className="text-xs text-muted">4 Languages</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
