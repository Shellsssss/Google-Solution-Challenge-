'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: string;
  numericEnd: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

const stats: Stat[] = [
  { value: '100,000+', numericEnd: 100000, suffix: '+', label: 'Medical images trained on' },
  { value: '95%+', numericEnd: 95, suffix: '%+', label: 'Model accuracy' },
  { value: '4', numericEnd: 4, label: 'Languages supported' },
  { value: '₹0.08', numericEnd: 8, prefix: '₹0.0', label: 'Cost per screening' },
];

function AnimatedCounter({ stat, trigger }: { stat: Stat; trigger: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    const start = 0;
    const end = stat.numericEnd;
    const duration = 2000;
    const step = end / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += step;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [trigger, stat.numericEnd]);

  const formatCount = () => {
    if (stat.prefix === '₹0.0') return `₹0.0${count > 0 ? count : 8}`;
    if (stat.numericEnd >= 1000) return count.toLocaleString('en-IN');
    return count.toString();
  };

  return (
    <span>
      {stat.prefix && stat.prefix !== '₹0.0' ? stat.prefix : ''}
      {trigger ? formatCount() : '0'}
      {stat.suffix ?? ''}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) setTriggered(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggered]);

  return (
    <div
      ref={ref}
      className="bg-background-card border-y border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedCounter stat={stat} trigger={triggered} />
              </div>
              <div className="text-sm text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
