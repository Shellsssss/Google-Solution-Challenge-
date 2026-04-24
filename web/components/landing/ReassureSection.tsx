const items = [
  { emoji: '🆓', title: 'Always free', body: 'No subscriptions, no hidden costs. JanArogya is and will always be free.' },
  { emoji: '📶', title: 'Works offline', body: 'The AI runs directly on your phone. No internet needed after first install.' },
  { emoji: '🌐', title: 'Your language', body: 'Results in English, हिंदी, தமிழ், or తెలుగు. More coming soon.' },
  { emoji: '🔒', title: 'Stays private', body: 'Your photos are never stored or shared. Analysis happens on-device.' },
];

export default function ReassureSection() {
  return (
    <section className="reassure">
      <div className="reassure-grid">
        {items.map((item) => (
          <div className="reassure-item" key={item.title}>
            <div className="ico">
              <span style={{ fontSize: '26px' }}>{item.emoji}</span>
            </div>
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
