'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingChat() {
  const T = useT();
  const { language } = useAppStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show welcome message on first open
  const initialized = useRef(false);
  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      setMessages([{ role: 'assistant', content: T.chat_welcome }]);
    }
  }, [open, T.chat_welcome]);

  // Update welcome message language when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: T.chat_welcome }];
      }
      return prev;
    });
  }, [T.chat_welcome]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          language,
        }),
      });
      const data = await res.json() as { response?: string; error?: string };
      const reply = data.response ?? T.chat_error;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: T.chat_error }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, language, open, T.chat_error]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '20px', zIndex: 9000,
          width: '340px', maxHeight: '520px',
          background: 'var(--surface)', borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(42,36,29,0.22)', border: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: 'var(--font-body)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 16px', background: 'var(--brand)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              🌿
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: '14px', color: '#fff', fontFamily: 'var(--font-head)' }}>{T.chat_title}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '1px' }}>{T.chat_sub}</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', width: 28, height: 28, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 13px', fontSize: '13px', lineHeight: 1.55,
                  background: m.role === 'user' ? 'var(--brand)' : 'var(--bg)',
                  color: m.role === 'user' ? '#fff' : 'var(--ink)',
                  border: m.role === 'assistant' ? '1px solid var(--line)' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', fontSize: '13px', color: 'var(--ink-soft)' }}>
                  <span style={{ display: 'inline-flex', gap: '3px' }}>
                    {[0, 1, 2].map((d) => (
                      <span key={d} style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)', animation: `bounce 1s ${d * 0.2}s infinite` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--line)', display: 'flex', gap: '8px', background: 'var(--surface)' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={T.chat_placeholder}
              disabled={loading}
              style={{
                flex: 1, border: '1.5px solid var(--line)', borderRadius: '12px',
                padding: '9px 13px', fontSize: '13px', fontFamily: 'inherit',
                background: 'var(--bg)', color: 'var(--ink)', outline: 'none',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? 'var(--brand)' : 'var(--line)',
                color: '#fff', border: 'none', borderRadius: '12px',
                width: '38px', height: '38px', cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', transition: 'background 0.15s',
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9001, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
        {/* Label pill — shown when closed */}
        {!open && (
          <div style={{
            background: 'var(--brand)', color: '#fff',
            borderRadius: '999px', padding: '6px 14px',
            fontSize: '13px', fontWeight: 700,
            boxShadow: '0 4px 16px rgba(31,122,90,0.3)',
            animation: 'fabPop 0.3s ease',
            whiteSpace: 'nowrap',
          }}>
            🌿 {T.chat_title}
          </div>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            position: 'relative',
            width: '64px', height: '64px', borderRadius: '22px',
            background: open ? '#2a241d' : 'var(--brand)',
            color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
            boxShadow: open
              ? '0 4px 20px rgba(0,0,0,0.25)'
              : '0 6px 24px rgba(31,122,90,0.45), 0 0 0 4px rgba(31,122,90,0.15)',
            transition: 'all 0.2s', fontFamily: 'inherit',
            animation: open ? 'none' : 'fabPulse 2.5s ease-in-out infinite',
          }}
          aria-label={T.chat_title}
        >
          {open ? '✕' : '💬'}
          {unread > 0 && !open && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px',
              background: 'var(--danger)', color: '#fff', borderRadius: '999px',
              minWidth: '20px', height: '20px', fontSize: '11px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 5px', border: '2px solid #fff',
            }}>
              {unread}
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 6px 24px rgba(31,122,90,0.45), 0 0 0 4px rgba(31,122,90,0.15); }
          50%       { box-shadow: 0 6px 32px rgba(31,122,90,0.6),  0 0 0 8px rgba(31,122,90,0.1); }
        }
        @keyframes fabPop {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
