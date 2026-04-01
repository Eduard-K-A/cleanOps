'use client';

import React from 'react';
import { FileText, Users, CheckCircle } from 'lucide-react';

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

function Step({ number, title, description, icon, isLast = false }: StepProps) {
  return (
    <div className="relative flex flex-col items-center text-center max-w-xs">
      {/* Step Circle */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6 relative z-10"
        style={{ backgroundColor: 'var(--md-primary-500)' }}
      >
        {icon}
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div
          className="absolute top-8 left-full w-full h-0.5 -translate-y-1/2"
          style={{
            backgroundColor: 'var(--md-primary-200)',
            width: 'calc(100% + 4rem)'
          }}
        />
      )}

      {/* Content */}
      <h3 
        className="text-xl font-bold mb-3"
        style={{ 
          color: 'var(--md-on-surface)',
          fontFamily: 'var(--md-font-display)'
        }}
      >
        {title}
      </h3>
      
      <p 
        className="text-base leading-relaxed"
        style={{ color: 'var(--md-on-surface-muted)' }}
      >
        {description}
      </p>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Post a Job',
      description: 'Create detailed cleaning job postings with specific requirements, timeline, and budget in minutes.',
      icon: <FileText size={24} />
    },
    {
      number: 2,
      title: 'Review Candidates',
      description: 'Receive applications from vetted cleaning professionals, review profiles, and compare qualifications.',
      icon: <Users size={24} />
    },
    {
      number: 3,
      title: 'Hire & Track',
      description: 'Select the best candidate, manage the job through completion, and handle payments seamlessly.',
      icon: <CheckCircle size={24} />
    }
  ];

  return (
    <section className="py-20" style={{ backgroundColor: 'var(--md-surface)' }}>
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
            How It Works
          </h2>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Get your cleaning jobs filled with qualified professionals in three simple steps
          </p>
        </div>

        {/* Stepper */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          {steps.map((step, index) => (
            <Step
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <div 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
            style={{ backgroundColor: 'var(--md-primary-50)' }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--md-success)' }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--md-primary-700)' }}
            >
              Average time to hire: 48 hours
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
