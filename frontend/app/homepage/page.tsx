'use client';

import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsBar } from '@/components/home/StatsBar';
import { FeatureHighlights } from '@/components/home/FeatureHighlights';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { CTABanner } from '@/components/home/CTABanner';
import { Footer } from '@/components/home/Footer';

function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--md-background)' }}>
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Bar */}
      <StatsBar />

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* How It Works */}
      <HowItWorks />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Banner */}
      <CTABanner />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default HomePage;
