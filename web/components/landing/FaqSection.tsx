const faqs = [
  {
    q: 'Is JanArogya really free?',
    a: 'Yes — completely free, forever. JanArogya is a non-profit project dedicated to making cancer screening accessible for every Indian. There are no hidden charges, subscriptions, or ads.',
  },
  {
    q: 'Is it accurate?',
    a: 'Our AI model achieves over 90% accuracy on held-out test data for oral cancer screening and 88% for skin lesion classification. However, JanArogya is a screening tool, not a diagnostic tool. A high-risk result means you should see a doctor — it is not a confirmed diagnosis.',
  },
  {
    q: 'Does it store my photos?',
    a: 'No. Your photo is analysed and immediately discarded. We do not store images, names, or any personally identifiable information. The on-device model processes everything locally.',
  },
  {
    q: 'What languages does it support?',
    a: 'Currently English, Hindi (हिंदी), Tamil (தமிழ்), and Telugu (తెలుగు). We are working on Bengali, Marathi, and Gujarati.',
  },
  {
    q: 'What should I do if I get a HIGH RISK result?',
    a: 'See a doctor as soon as possible. JanArogya will show you the nearest government cancer-screening clinics and hospitals. You can also call the national cancer helpline: 1800-11-2345 (free).',
  },
];

export default function FaqSection() {
  return (
    <section className="section">
      <div className="container">
        <p className="kicker">FAQ</p>
        <h2>Common questions</h2>
        <p className="subtitle">Everything you need to know before your first scan.</p>

        <div className="faq-list">
          {faqs.map((faq) => (
            <details className="faq" key={faq.q}>
              <summary>
                {faq.q}
                <span className="plus">+</span>
              </summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
