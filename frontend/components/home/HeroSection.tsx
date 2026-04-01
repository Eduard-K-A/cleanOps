'use client';

import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--md-primary-700) 0%, var(--md-primary-50) 100%)`,
        minHeight: '600px'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            {/* Breadcrumb-style trust indicators */}
            <div className="flex items-center gap-4 text-sm opacity-80">
              <span>Trusted by industry leaders</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
              </div>
            </div>

            {/* Main Headline */}
            <h1 
              className="leading-tight"
              style={{ 
                fontSize: 'var(--md-text-display-lg)',
                fontFamily: 'var(--md-font-display)',
                fontWeight: 400,
                lineHeight: 'var(--md-lh-display-lg)'
              }}
            >
              Transform Your Cleaning Business with
              <span className="block font-semibold">Smart Job Management</span>
            </h1>

            {/* Supporting Sub-headline */}
            <p 
              className="text-xl max-w-lg"
              style={{ opacity: 0.9, fontFamily: 'var(--md-font-body)' }}
            >
              Connect with qualified cleaning professionals, streamline operations, and grow your business with our AI-powered platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="group px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'white',
                  color: 'var(--md-primary-700)',
                  boxShadow: 'var(--md-elevation-2)'
                }}
              >
                Get Started Free
                <ArrowRight 
                  size={20} 
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              
              <button
                className="px-8 py-4 rounded-full font-semibold text-lg border-2 transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  borderColor: 'white',
                  color: 'white',
                  backgroundColor: 'transparent'
                }}
              >
                <Play size={20} />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right - Dashboard Mockup */}
          <div className="relative">
            {/* Floating dashboard preview card */}
            <div
              className="relative bg-white rounded-2xl p-6 shadow-2xl"
              style={{
                boxShadow: 'var(--md-elevation-3)',
                borderRadius: 'var(--md-radius-xl)',
                animation: 'float 6s ease-in-out infinite'
              }}
            >
              {/* Mock dashboard content */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--md-divider)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: 'var(--md-primary-100)' }} />
                    <div>
                      <div className="h-2 w-24 rounded" style={{ backgroundColor: 'var(--md-primary-200)' }} />
                      <div className="h-2 w-16 rounded mt-1" style={{ backgroundColor: 'var(--md-primary-100)' }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--md-success)' }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--md-warning)' }} />
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--md-surface-variant)' }}>
                      <div className="h-8 w-8 rounded mb-2" style={{ backgroundColor: 'var(--md-primary-200)' }} />
                      <div className="h-3 w-16 rounded mb-1" style={{ backgroundColor: 'var(--md-primary-300)' }} />
                      <div className="h-2 w-12 rounded" style={{ backgroundColor: 'var(--md-primary-100)' }} />
                    </div>
                  ))}
                </div>

                {/* Chart Mock */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--md-surface-variant)' }}>
                  <div className="h-2 w-20 rounded mb-3" style={{ backgroundColor: 'var(--md-primary-200)' }} />
                  <div className="flex items-end gap-1 h-20">
                    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${height}%`,
                          backgroundColor: 'var(--md-primary-300)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating indicators */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                ✓
              </div>
              <div className="absolute -bottom-3 -left-3 px-3 py-1 bg-blue-500 text-white text-xs rounded-full shadow-lg">
                Live Data
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-8 text-white text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">500+</span>
              <span>Companies Trust Us</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <span className="font-semibold">4.9★</span>
              <span>Average Rating</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <span className="font-semibold">24/7</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </section>
  );
}
