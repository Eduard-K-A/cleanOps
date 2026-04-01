'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export function CTABanner() {
  return (
    <section
      className="py-20"
      style={{
        backgroundColor: 'var(--md-primary-700)',
        backgroundImage: `linear-gradient(135deg, var(--md-primary-700) 0%, var(--md-primary-600) 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Headline */}
        <h2 
          className="text-4xl lg:text-5xl font-bold mb-6 text-white"
          style={{ 
            fontFamily: 'var(--md-font-display)',
            lineHeight: '1.2'
          }}
        >
          Ready to Transform Your Cleaning Business?
        </h2>

        {/* Supporting Text */}
        <p 
          className="text-xl lg:text-2xl mb-10 text-white max-w-3xl mx-auto"
          style={{ opacity: 0.9 }}
        >
          Join thousands of cleaning professionals who are already saving time, 
          reducing costs, and growing their business with cleanOps.
        </p>

        {/* CTA Button */}
        <button
          className="group px-10 py-5 rounded-full font-semibold text-xl transition-all duration-300 inline-flex items-center gap-3"
          style={{
            backgroundColor: 'white',
            color: 'var(--md-primary-700)',
            boxShadow: 'var(--md-elevation-3)'
          }}
        >
          Start Your Free Trial
          <ArrowRight 
            size={24} 
            className="group-hover:translate-x-2 transition-transform"
          />
        </button>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-8 mt-12 text-white text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">✓</div>
            <span>No credit card required</span>
          </div>
          <div className="w-px h-4 bg-white/30" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">✓</div>
            <span>14-day free trial</span>
          </div>
          <div className="w-px h-4 bg-white/30" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">✓</div>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
