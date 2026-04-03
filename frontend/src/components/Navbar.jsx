// Navbar.jsx — Top navigation bar
import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Detect',       href: '#detect' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Modalities',   href: '#modalities' },
    { label: 'Stats',        href: '#stats' },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        transition: 'all var(--transition)',
        background: scrolled ? 'var(--color-bg)' : 'rgba(var(--color-bg-rgb), 0.1)',
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        opacity: 0.98,
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--color-accent-glow)',
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem',
            background: 'linear-gradient(90deg, var(--color-text), var(--color-accent))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            DeepShield
          </span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="desktop-nav">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ 
                padding: '8px 20px', 
                borderRadius: '10px', 
                fontSize: '0.9rem', 
                fontWeight: 500, 
                color: 'var(--color-text-muted)', 
                transition: 'all var(--transition)',
                background: 'transparent'
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.color = 'var(--color-text)'; 
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.color = 'var(--color-text-muted)'; 
                e.currentTarget.style.background = 'transparent'; 
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Theme Toggle + mobile btn */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={toggle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '10px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.borderColor = 'var(--color-accent)'; 
              e.currentTarget.style.boxShadow = '0 0 20px var(--color-accent-glow)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.borderColor = 'var(--color-border)'; 
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', background: 'none', color: 'var(--color-text)', padding: '6px', border: 'none', cursor: 'pointer' }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{ 
          background: 'var(--color-bg)', 
          borderTop: '1px solid var(--color-border)', 
          padding: '16px 24px 24px',
          animation: 'fadeInUp 0.4s var(--ease-out-expo) both'
        }}>
          {navLinks.map((link, idx) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{ 
                display: 'block', padding: '14px 0', borderBottom: '1px solid var(--color-border)', 
                color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 500,
                animation: `fadeInUp 0.4s ${0.1 + idx * 0.05}s var(--ease-out-expo) both`
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

