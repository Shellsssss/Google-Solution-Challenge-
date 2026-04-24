'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const PhoneDemoModal = dynamic(() => import('./PhoneDemoModal'), { ssr: false });

const typewriterWords = ['Rural India', '600M People', 'Your Community', 'Zero Cost'];

export default function HeroSection() {
  const [wordIndex, setWordIndex]   = useState(0);
  const [displayed, setDisplayed]   = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [phoneOpen, setPhoneOpen]   = useState(false);

  useEffect(() => {
    const currentWord = typewriterWords[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < currentWord.length) {
      timeout = setTimeout(() => setDisplayed(currentWord.slice(0, displayed.length + 1)), 80);
    } else if (!isDeleting && displayed.length === currentWord.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 50);
    } else {
      setIsDeleting(false);
      setWordIndex((i) => (i + 1) % typewriterWords.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex]);

  return (
    <>
      {phoneOpen && <PhoneDemoModal onClose={() => setPhoneOpen(false)} />}

      <section className="hero">
        <div className="hero-inner">
          {/* Left */}
          <div>
            <span className="eyebrow">❤️ Free · No internet needed · Works offline</span>
            <h1>
              Find it early.<br />
              <span className="c">Stay healthy.</span>
            </h1>
            <p className="sub">
              Take a photo of your mouth or a mark on your skin. Our AI checks it for signs of cancer in seconds — in your language, for free.
            </p>

            <div className="hero-ctas">
              <Link href="/scan">
                <button className="btn big full">📷 Start a free check</button>
              </Link>
              <button
                className="btn accent-btn full"
                onClick={() => setPhoneOpen(true)}
              >
                📱 Try Phone Demo
              </button>
            </div>

            <div className="hero-foot">
              <span>✅ No sign-up needed</span>
              <span>🌐 4 languages</span>
              <span>🔒 Stays private</span>
            </div>
          </div>

          {/* Right: stats art */}
          <div className="hero-art">
            {/* Today tile */}
            <div className="hero-tile" style={{ gridColumn: '1 / -1' }}>
              <div>
                <div className="lbl">🌿 SDG 3 · Good Health for All</div>
              </div>
              <div>
                <div className="num" style={{ fontSize: '22px', marginBottom: '4px' }}>
                  Cancer Screening for{' '}
                  <span style={{ color: 'var(--brand)', display: 'inline-block', minWidth: '120px' }}>
                    {displayed}<span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-tile">
              <div className="lbl">Detected Early</div>
              <div className="num">91%</div>
              <div className="lbl">accuracy</div>
            </div>

            <div className="hero-tile t2">
              <div className="lbl">Analysis Time</div>
              <div className="num">2.3s</div>
              <div className="lbl">per scan</div>
            </div>

            <div className="hero-tile t3">
              <div className="lbl">People Served</div>
              <div className="num">600M</div>
              <div className="lbl">rural India</div>
            </div>

            <div className="hero-tile t4">
              <div className="lbl">Languages</div>
              <div className="num">4</div>
              <div className="lbl" style={{ lineHeight: 1.4 }}>EN · HI · TA · TE</div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </>
  );
}
