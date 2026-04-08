'use client';

import { motion } from 'framer-motion';

const technologies = [
  {
    letter: 'G',
    name: 'Gemini Vision',
    description: 'Multimodal AI for medical image understanding and explanation generation',
    color: 'bg-blue-500',
  },
  {
    letter: 'V',
    name: 'Vertex AI',
    description: 'Scalable ML model training and deployment on Google Cloud',
    color: 'bg-purple-500',
  },
  {
    letter: 'T',
    name: 'TFLite',
    description: 'On-device inference for offline screening in low-connectivity regions',
    color: 'bg-orange-500',
  },
  {
    letter: 'F',
    name: 'Firebase',
    description: 'Real-time database, authentication and cloud storage for patient data',
    color: 'bg-yellow-500',
  },
  {
    letter: 'M',
    name: 'Google Maps',
    description: 'Geolocation for finding nearby cancer screening centres across India',
    color: 'bg-green-500',
  },
  {
    letter: 'C',
    name: 'Cloud Run',
    description: 'Serverless containers for scalable backend API serving millions of requests',
    color: 'bg-teal-500',
  },
  {
    letter: 'Fl',
    name: 'Flutter',
    description: 'Cross-platform mobile app for Android with offline-first capabilities',
    color: 'bg-cyan-500',
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function TechSection() {
  return (
    <section className="py-20 bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Built on <span className="text-accent">7 Google Technologies</span>
            </h2>
            <p className="text-muted text-lg">
              Leveraging Google&apos;s most powerful AI and cloud infrastructure
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {technologies.map((tech) => (
            <motion.div
              key={tech.name}
              variants={item}
              className="bg-background-card border border-border rounded-2xl p-5 hover:border-border-light hover:bg-background-secondary transition-all duration-200 cursor-default group"
            >
              <div
                className={`w-10 h-10 ${tech.color} rounded-xl flex items-center justify-center text-white font-bold text-sm mb-3 group-hover:scale-110 transition-transform`}
              >
                {tech.letter}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{tech.name}</h3>
              <p className="text-xs text-muted leading-relaxed">{tech.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
