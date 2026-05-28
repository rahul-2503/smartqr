import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineGlobeAlt, HiOutlineCheck } from 'react-icons/hi2';
import { useLanguage } from '../i18n/LanguageContext';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export default function LanguageSwitcher() {
  const { lang, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="language-switcher"
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: open ? '#f0fdf4' : 'transparent',
          border: '1px solid',
          borderColor: open ? '#bbf7d0' : '#e4e4e7',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          color: '#3f3f46',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = '#d8f3dc';
            e.currentTarget.style.background = '#f8fdf9';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = '#e4e4e7';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <HiOutlineGlobeAlt style={{ width: 15, height: 15, color: '#2d6a4f' }} />
        <span>{current.flag}</span>
        <span className="lang-switcher-label">{current.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '180px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '14px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 12px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
              padding: '6px',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {languages.map((l) => (
              <button
                key={l.code}
                id={`lang-option-${l.code}`}
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: lang === l.code ? 700 : 500,
                  color: lang === l.code ? '#2d6a4f' : '#3f3f46',
                  background: lang === l.code ? '#f0fdf4' : 'transparent',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (lang !== l.code) e.currentTarget.style.background = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  if (lang !== l.code) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '18px' }}>{l.flag}</span>
                <span style={{ flex: 1 }}>{l.label}</span>
                {lang === l.code && (
                  <HiOutlineCheck style={{ width: 16, height: 16, color: '#2d6a4f' }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .lang-switcher-label { display: none; }
        }
      `}</style>
    </div>
  );
}
