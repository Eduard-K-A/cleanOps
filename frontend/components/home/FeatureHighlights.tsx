'use client';

import React from 'react';
import { Brain, TrendingUp, Zap } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="group p-8 rounded-xl transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor: 'var(--md-surface)',
        boxShadow: 'var(--md-elevation-1)',
        borderRadius: 'var(--md-radius-lg)',
        transition: 'all var(--md-duration-short) var(--md-motion-standard)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--md-elevation-3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--md-elevation-1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon on blue-tinted chip */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{
          backgroundColor: 'var(--md-primary-50)',
          color: 'var(--md-primary-600)'
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 
        className="text-xl font-bold mb-4"
        style={{ 
          color: 'var(--md-on-surface)',
          fontFamily: 'var(--md-font-display)'
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p 
        className="text-base leading-relaxed"
        style={{ color: 'var(--md-on-surface-muted)' }}
      >
        {description}
      </p>
    </div>
  );
}

export function FeatureHighlights() {
  const features = [
    {
      icon: <Brain size={32} />,
      title: 'Smart Job Matching',
      description: 'Our AI-powered algorithm matches your cleaning jobs with the most qualified professionals in your area, saving you time and ensuring quality results.'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Real-Time Analytics',
      description: 'Track performance, monitor costs, and optimize operations with comprehensive dashboards and real-time insights into your cleaning business.'
    },
    {
      icon: <Zap size={32} />,
      title: 'Automated Workflows',
      description: 'Streamline repetitive tasks with automated scheduling, invoicing, and communication workflows that scale with your business.'
    }
  ];

  return (
    <section className="py-20" style={{ backgroundColor: 'var(--md-background)' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-4xl font-bold mb-4"
            style={{ 
              color: 'var(--md-on-surface)',
              fontFamily: 'var(--md-font-display)'
            }}
          >
            Powerful Features for Modern Cleaning Businesses
          </h2>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Everything you need to manage your cleaning operations efficiently and grow your business
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
