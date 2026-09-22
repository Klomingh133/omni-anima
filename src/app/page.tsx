import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { HeroSection } from '@/components/marketing/HeroSection';
import { BentoFeatures } from '@/components/marketing/BentoFeatures';
import { KeyboardShortcuts } from '@/components/marketing/KeyboardShortcuts';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#212121] flex flex-col font-body">
      <MarketingNavbar />
      <main className="flex-1">
        <HeroSection />
        <BentoFeatures />
        <KeyboardShortcuts />
      </main>
      <MarketingFooter />
    </div>
  );
}
