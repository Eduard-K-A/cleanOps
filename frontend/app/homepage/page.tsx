"use client"

import React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function HomePage() {
  const [activeTab, setActiveTab] = useState('residential')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleNavigate(path: string) {
    setIsLoading(true)
    // small tick so spinner renders before navigation
    await new Promise((r) => setTimeout(r, 50))
    router.push(path)
  }

  const services = {
    residential: [
      { icon: '🏠', title: 'Home Deep Cleaning', description: 'Thorough cleaning of every corner of your home' },
      { icon: '🛋️', title: 'Upholstery Cleaning', description: 'Professional cleaning for furniture and fabrics' },
      { icon: '🪟', title: 'Window Cleaning', description: 'Crystal clear windows inside and outside' },
      { icon: '🧹', title: 'Regular Maintenance', description: 'Weekly or monthly cleaning schedules' }
    ],
    commercial: [
      { icon: '🏢', title: 'Office Cleaning', description: 'Keep your workspace clean and professional' },
      { icon: '🏬', title: 'Retail Spaces', description: 'Maintain customer-friendly environments' },
      { icon: '🏥', title: 'Medical Facilities', description: 'Sanitary and compliant cleaning standards' },
      { icon: '🍽️', title: 'Restaurant Cleaning', description: 'Health code compliant deep cleaning' }
    ]
  }

  const benefits = [
    { number: '5000+', label: 'Satisfied Customers', icon: '😊' },
    { number: '15+', label: 'Years Experience', icon: '⭐' },
    { number: '24/7', label: 'Customer Support', icon: '📞' },
    { number: '100%', label: 'Quality Guarantee', icon: '✓' }
  ]

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Homeowner', text: 'cleanOps transformed my home! Professional, reliable, and affordable.' },
    { name: 'Mike Chen', role: 'Business Owner', text: 'We switched to cleanOps for our office and could not be happier with the service.' },
    { name: 'Emma Davis', role: 'Property Manager', text: 'Consistent quality and excellent customer service. Highly recommended!' }
  ]

  return (
    <div className="w-full overflow-hidden bg-slate-50">
      {/* Hero Section */}
      <section className="bg-linear-to-br from-sky-500 to-cyan-500 text-white px-5 py-32 min-h-96 flex items-center justify-center">
        <div className="max-w-2xl text-center">
          <h1 className="text-6xl font-bold mb-5 leading-tight">Professional Cleaning Services</h1>
          <p className="text-2xl mb-10 opacity-95 font-light">Transform your space into a clean, healthy environment</p>
          <div className="flex gap-5 justify-center flex-wrap">
            {isLoading ? (
              <div className="flex items-center justify-center px-10 py-4">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <button onClick={() => handleNavigate('/customer/order')} className="bg-white text-sky-500 px-10 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                  Book Now
                </button>
                <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="bg-transparent text-white px-10 py-4 rounded-lg text-lg font-semibold border-2 border-white hover:bg-white hover:text-sky-500 transition-all">
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="px-5 py-32 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-3 text-slate-900">Our Services</h2>
          <p className="text-lg text-center text-slate-500 mb-16">Customized cleaning solutions for every need</p>

          <div className="flex justify-center gap-5 mb-16">
            <button
              onClick={() => setActiveTab('residential')}
              className={`px-8 py-3 rounded-lg text-base font-semibold transition-all ${
                activeTab === 'residential'
                  ? 'bg-sky-500 text-white border-2 border-sky-500'
                  : 'bg-white text-slate-500 border-2 border-slate-200 hover:border-sky-300'
              }`}
            >
              Residential
            </button>
            <button
              onClick={() => setActiveTab('commercial')}
              className={`px-8 py-3 rounded-lg text-base font-semibold transition-all ${
                activeTab === 'commercial'
                  ? 'bg-sky-500 text-white border-2 border-sky-500'
                  : 'bg-white text-slate-500 border-2 border-slate-200 hover:border-sky-300'
              }`}
            >
              Commercial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services[activeTab as keyof typeof services].map((service, idx) => (
              <div key={idx} className="bg-slate-100 p-10 rounded-xl text-center hover:shadow-lg hover:border-sky-300 transition-all cursor-pointer border-2 border-transparent">
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{service.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-5 py-32 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-slate-900">Why Choose cleanOps?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <div className="text-4xl font-bold text-sky-500 mb-2">{benefit.number}</div>
                <div className="text-lg text-slate-900 font-semibold">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-5 py-32 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-slate-900">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-slate-100 p-10 rounded-xl border border-slate-200">
                <div className="text-yellow-400 text-lg mb-4">★★★★★</div>
                <p className="text-base text-slate-600 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                <div>
                  <strong className="text-slate-900">{testimonial.name}</strong>
                  <span className="block text-sm text-slate-500 mt-1">{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-br from-cyan-500 to-sky-500 text-white px-5 py-32 text-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold mb-4">Ready to Experience Cleanliness?</h2>
          <p className="text-xl mb-10 opacity-95">Get started with a free quote today</p>
          {isLoading ? (
            <div className="inline-block">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <button onClick={() => handleNavigate('/customer/order')} className="inline-block bg-white text-sky-500 px-16 py-5 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
              Schedule Your Cleaning
            </button>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="px-5 py-32 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-slate-900">🔒 Trusted & Insured</h3>
              <p className="text-base text-slate-500 leading-relaxed">All staff fully screened, insured, and bonded for your peace of mind</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-slate-900">🌱 Eco-Friendly</h3>
              <p className="text-base text-slate-500 leading-relaxed">We use environmentally safe cleaning products and sustainable practices</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-slate-900">⚡ Fast & Flexible</h3>
              <p className="text-base text-slate-500 leading-relaxed">Quick turnaround times and flexible scheduling to fit your lifestyle</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
