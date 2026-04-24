export default function HowItWorksSection() {
  const steps = [
    {
      emoji: '📷',
      title: 'Take a photo',
      body: 'Use any phone camera. Take a clear, well-lit photo of your mouth or the skin mark you are worried about.',
    },
    {
      emoji: '🤖',
      title: 'We check it',
      body: 'Our AI — trained on thousands of real medical images — analyses your photo for visual signs of cancer in under 3 seconds.',
    },
    {
      emoji: '📋',
      title: 'You get an answer',
      body: 'See a clear LOW RISK or HIGH RISK result in your language. High risk? We show you nearby clinics and explain what to do next.',
    },
  ];

  return (
    <section className="section" id="how-it-works" style={{ background: 'var(--surface)' }}>
      <div className="container">
        <p className="kicker">How it works</p>
        <h2>Three simple steps</h2>
        <p className="subtitle">No doctor visit needed. No account. No data stored. Completely free.</p>

        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{i + 1}</div>
              <div className="ico">
                <span style={{ fontSize: '40px' }}>{s.emoji}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
