'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, AlertTriangle, Stethoscope } from 'lucide-react';

const impactStats = [
  {
    icon: TrendingUp,
    value: '74.9%',
    label: 'live in rural areas',
    description: 'with limited healthcare access',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    icon: AlertTriangle,
    value: '80%',
    label: 'diagnosed late',
    description: 'when treatment is less effective',
    color: 'text-danger',
    bg: 'bg-danger/10',
  },
  {
    icon: Stethoscope,
    value: '1:500K',
    label: 'oncologist ratio',
    description: 'one doctor per 500,000 people in rural India',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: Users,
    value: '₹0.08',
    label: 'JanArogya cost per screen',
    description: 'vs ₹2,000–₹5,000 for private diagnostics',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

export default function ImpactSection() {
  return (
    <section className="py-24 bg-background-primary relative overflow-hidden">
      {/* Decorative grid */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Big number */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-7xl md:text-9xl font-black text-white mb-2">
              77,000
            </div>
            <p className="text-xl md:text-2xl text-muted mb-2">
              new oral cancer cases per year in India
            </p>
            <p className="text-sm text-muted/60">
              Source: ICMR NCRP, GLOBOCAN 2021
            </p>
          </motion.div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {impactStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background-card rounded-2xl border border-border p-5 text-center"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-white text-sm font-medium mb-1">{stat.label}</div>
                <div className="text-muted text-xs">{stat.description}</div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-background-card rounded-3xl border border-border p-10"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Early detection saves 90% of lives
          </h3>
          <p className="text-muted text-lg mb-6 max-w-2xl mx-auto">
            JanArogya bridges the gap between advanced AI and rural communities — bringing
            hospital-grade screening to every village in India.
          </p>
          <a href="/scan">
            <button className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-lg hover:scale-105">
              Start Free Screening →
            </button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
