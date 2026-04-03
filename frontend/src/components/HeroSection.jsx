// HeroSection.jsx — Landing hero with animated headline and CTA
import React from 'react';
import { Shield, ArrowRight, Cpu, Eye, Zap } from 'lucide-react';
import { Button } from './ui/button';

const PILLS = [
  { icon: <Cpu size={13} />,  label: 'Neural Network Analysis' },
  { icon: <Eye size={13} />,  label: 'Visual Explainability' },
  { icon: <Zap size={13} />,  label: 'Real-Time Detection' },
];

export default function HeroSection() {
  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: '80px' }}>

      {/* Background orbs */}
      <div className="orb orb-purple" style={{ width: 600, height: 600, top: -200, left: -200, position: 'absolute' }} />
      <div className="orb orb-cyan"   style={{ width: 400, height: 400, bottom: -100, right: -100, position: 'absolute' }} />
      <div className="orb orb-pink"   style={{ width: 300, height: 300, top: '30%', right: '20%', position: 'absolute' }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '60px 24px' }}>

        {/* Badge */}
        <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.8s var(--ease-out-expo) both' }}>
          <span className="badge badge-accent" style={{ padding: '8px 20px', borderRadius: '12px' }}><Shield size={14} /> AI-Powered Deepfake Detection</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(3.2rem, 8vw, 6.5rem)',
          fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em',
          marginBottom: '28px', animation: 'fadeInUp 0.8s 0.1s var(--ease-out-expo) both',
        }}>
          Detect Deepfakes
          <br />
          <span className="text-gradient">Before They Spread</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)', color: 'var(--color-text-muted)',
          maxWidth: '680px', margin: '0 auto 48px', lineHeight: 1.6,
          animation: 'fadeInUp 0.8s 0.2s var(--ease-out-expo) both',
        }}>
          Upload multiple files of any media format and let Project Xero's neural pipeline analyze them
          for manipulation — with visual region-level explainability, confidence scoring,
          and forensic report.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '52px' }}>
          {PILLS.map((pill, idx) => (
            <div key={pill.label} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: '99px',
              background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)',
              fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)',
              animation: `fadeInUp 0.8s ${0.3 + idx * 0.1}s var(--ease-out-expo) both`,
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-subtle)'; }}
            >
              <span style={{ color: 'var(--color-accent)', display: 'flex' }}>{pill.icon}</span>
              {pill.label}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeInUp 0.8s 0.6s var(--ease-out-expo) both' }}>
          <Button 
            className="btn-primary"
            style={{ 
              height: 'auto', 
              padding: '16px 36px', 
              fontSize: '1.05rem', 
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-cyan))',
              border: 'none',
              boxShadow: '0 8px 30px var(--color-accent-glow)',
            }}
            onClick={() => document.getElementById('detect')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Launch Detector <ArrowRight size={20} style={{ marginLeft: '10px' }} />
          </Button>
          <button 
            className="btn-secondary" 
            style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: '14px' }}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            How It Works
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '64px', justifyContent: 'center', marginTop: '80px', flexWrap: 'wrap' }}>
          {[
            { value: '97.4%', label: 'Detection Accuracy' },
            { value: '<2s',   label: 'Avg. Analysis Time' },
            { value: '6+',    label: 'Detection Modalities' },
          ].map((stat, idx) => (
            <div key={stat.label} style={{ textAlign: 'center', animation: `fadeInUp 0.8s ${0.7 + idx * 0.1}s var(--ease-out-expo) both` }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800,
                color: 'var(--color-text)',
                lineHeight: 1, marginBottom: '8px',
                textShadow: '0 0 20px rgba(var(--color-bg-rgb), 0.5)',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div style={{ marginTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'fadeIn 1s 1s ease both', opacity: 0.5 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll to explore</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, var(--color-accent), transparent)' }} />
        </div>
      </div>
    </section>
  );
}
