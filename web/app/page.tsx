import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import HeroSection from '@/components/landing/HeroSection';
import StatsSection from '@/components/landing/StatsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import RiskLevelsSection from '@/components/landing/RiskLevelsSection';
import TechSection from '@/components/landing/TechSection';
import DemoSection from '@/components/landing/DemoSection';
import ImpactSection from '@/components/landing/ImpactSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <RiskLevelsSection />
        <TechSection />
        <DemoSection />
        <ImpactSection />
      </main>
      <Footer />
    </div>
  );
}
