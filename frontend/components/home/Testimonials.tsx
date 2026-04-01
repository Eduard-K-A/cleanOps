'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    company: 'CleanSolutions Inc.',
    role: 'Operations Manager',
    content: 'cleanOps has transformed how we manage our cleaning contracts. The smart matching feature saves us hours every week, and the quality of professionals is exceptional.',
    rating: 5,
    avatar: 'SJ'
  },
  {
    id: 2,
    name: 'Michael Chen',
    company: 'Sparkle Services',
    role: 'Business Owner',
    content: 'We\'ve been using cleanOps for 6 months and our efficiency has increased by 40%. The automated workflows and real-time analytics are game-changers for our business.',
    rating: 5,
    avatar: 'MC'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    company: 'Premier Clean Co.',
    role: 'CEO',
    content: 'The platform is intuitive and the support team is amazing. We\'ve scaled from 10 to 50 cleaning professionals in just 3 months thanks to cleanOps.',
    rating: 5,
    avatar: 'ER'
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-current' : ''}
          style={{
            color: i < rating ? 'var(--md-warning)' : 'var(--md-divider)'
          }}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

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
            What Our Clients Say
          </h2>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Join thousands of satisfied cleaning businesses using cleanOps
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Carousel Container */}
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 p-8"
                  style={{
                    backgroundColor: 'var(--md-surface)',
                    boxShadow: 'var(--md-elevation-2)',
                    borderRadius: 'var(--md-radius-xl)'
                  }}
                >
                  <div className="max-w-3xl mx-auto">
                    {/* Quote */}
                    <blockquote 
                      className="text-xl leading-relaxed mb-8 text-center"
                      style={{ 
                        color: 'var(--md-on-surface)',
                        fontFamily: 'var(--md-font-body)'
                      }}
                    >
                      "{testimonial.content}"
                    </blockquote>

                    {/* Rating */}
                    <div className="flex justify-center mb-6">
                      <StarRating rating={testimonial.rating} />
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center justify-center gap-4">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: 'var(--md-primary-500)' }}
                      >
                        {testimonial.avatar}
                      </div>

                      {/* Name and Company */}
                      <div className="text-left">
                        <div 
                          className="font-semibold text-lg"
                          style={{ color: 'var(--md-on-surface)' }}
                        >
                          {testimonial.name}
                        </div>
                        <div 
                          className="text-sm"
                          style={{ color: 'var(--md-on-surface-muted)' }}
                        >
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:shadow-xl"
            style={{ color: 'var(--md-primary-500)' }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:shadow-xl"
            style={{ color: 'var(--md-primary-500)' }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: index === currentIndex 
                    ? 'var(--md-primary-500)' 
                    : 'var(--md-divider)',
                  width: index === currentIndex ? '24px' : '8px'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
