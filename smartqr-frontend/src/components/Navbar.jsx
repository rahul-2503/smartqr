import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineQrCode, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/scan', label: 'Scan' },
    { to: '/about', label: 'About' },
  ];

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #f1f3f5' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <nav className="container-main navbar-height" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2d6a4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiOutlineQrCode style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
            Smart<span style={{ color: '#2d6a4f' }}>QR</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ alignItems: 'center', gap: '4px' }} className="nav-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                color: location.pathname === link.to ? '#2d6a4f' : '#718096',
                background: location.pathname === link.to ? '#f0fdf4' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/scan"
            className="nav-desktop"
            style={{
              alignItems: 'center', gap: '8px',
              padding: '8px 16px', background: '#2d6a4f', color: 'white',
              fontSize: '14px', fontWeight: 600, borderRadius: '8px',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
          >
            <HiOutlineQrCode style={{ width: 14, height: 14 }} />
            Scan Product
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="nav-mobile-toggle"
            aria-label="Toggle navigation menu"
            style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}
          >
            {mobileOpen ? <HiOutlineXMark style={{ width: 20, height: 20 }} /> : <HiOutlineBars3 style={{ width: 20, height: 20 }} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="nav-mobile-menu"
            style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f1f3f5', overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 32px' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'block', padding: '12px 16px', fontSize: '14px', fontWeight: 500,
                    borderRadius: '8px', textDecoration: 'none',
                    color: location.pathname === link.to ? '#2d6a4f' : '#718096',
                    background: location.pathname === link.to ? '#f0fdf4' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
