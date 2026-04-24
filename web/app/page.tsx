import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import HeroSection from '@/components/landing/HeroSection';
import DualCtaSection from '@/components/landing/DualCtaSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import ReassureSection from '@/components/landing/ReassureSection';
import QuoteBandSection from '@/components/landing/QuoteBandSection';
import PhoneDemoSection from '@/components/landing/PhoneDemoSection';
import FaqSection from '@/components/landing/FaqSection';

export default function Home() {
  return (
    <div>
      <Navbar />
      <main>
        <HeroSection />
        <DualCtaSection />
        <HowItWorksSection />
        <ReassureSection />
        <QuoteBandSection />
        <PhoneDemoSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
