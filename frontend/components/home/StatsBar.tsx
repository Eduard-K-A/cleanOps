'use client';

import React from 'react';
import { Briefcase, DollarSign, Star } from 'lucide-react';

export function StatsBar() {
  const stats = [
    {
      icon: <Briefcase size={24} />,
      value: '10,000+',
      label: 'Jobs Posted',
      color: 'var(--md-primary-500)'
    },
    {
      icon: <DollarSign size={24} />,
      value: '$2M+',
      label: 'Saved',
      color: 'var(--md-success)'
    },
    {
      icon: <Star size={24} />,
      value: '98%',
      label: 'Satisfaction Rate',
      color: 'var(--md-warning)'
    }
  ];

  return (
    <section
      className="py-12"
      style={{
        backgroundColor: 'var(--md-surface)',
        boxShadow: 'var(--md-elevation-1)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-3">
              {/* Icon */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ 
                  backgroundColor: `${stat.color}15`,
                  color: stat.color
                }}
              >
                {stat.icon}
              </div>
              
              {/* Value */}
              <div 
                className="text-4xl font-bold"
                style={{ 
                  color: stat.color,
                  fontFamily: 'var(--md-font-display)',
                  fontSize: '48px'
                }}
              >
                {stat.value}
              </div>
              
              {/* Label */}
              <p 
                className="text-lg font-medium"
                style={{ color: 'var(--md-on-surface-muted)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
