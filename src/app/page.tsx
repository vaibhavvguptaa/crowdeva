'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// More granular code splitting for homepage components
const Navbar = dynamic(() => import('@/components/Homepage/Navbar/Navbar'), { 
  ssr: false,
  loading: () => <div className="h-16 bg-neutral-900"></div>
});

const Hero = dynamic(() => import('@/components/Homepage/Hero/Hero'), { 
  ssr: false,
  loading: () => <div className="h-[91vh] bg-gradient-to-br from-neutral-800 to-neutral-900"></div>
});

const Features = dynamic(() => import('@/components/Homepage/Feature/Features').then(mod => mod.Features), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100"></div>
});

const Services = dynamic(() => import('@/components/Homepage/Services/Services'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-white"></div>
});

const Footer = dynamic(() => import('@/components/Homepage/Footer/Footer').then(mod => mod.Footer), { 
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-950"></div>
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero />
      <Features />
      <Services />
      <Footer />
    </div>
  );
}