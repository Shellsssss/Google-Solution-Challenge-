import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="ja-footer">
      <p>
        Built with ❤️ for rural India{' · '}
        <Link href="/about">About</Link>
        {' · '}
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        {' · '}
        <span>🌿 SDG&nbsp;3 &amp; SDG&nbsp;10</span>
      </p>
      <p style={{ marginTop: '6px', fontSize: '12px', opacity: 0.75 }}>
        JanArogya is an AI-assisted screening tool — not a medical diagnostic device. Always consult a qualified doctor.
      </p>
    </footer>
  );
}
