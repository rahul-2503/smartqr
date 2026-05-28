import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineQrCode, HiOutlineShieldCheck, HiOutlineArrowRight } from 'react-icons/hi2';
import { useLanguage } from '../../i18n/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();
  // Parallax mouse effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform coordinates to soft angles
  const rotateX = useTransform(y, [-300, 300], [10, -10]);
  const rotateY = useTransform(x, [-300, 300], [-10, 10]);

  function handleMouse(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <section 
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        overflow: 'hidden', 
        paddingTop: '80px', 
        background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.03), transparent 45%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.02), transparent 45%), #faf9f6'
      }}
    >
      {/* Dynamic line grid background */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          opacity: 0.05, 
          backgroundImage: 'linear-gradient(#09090b 1px, transparent 1px), linear-gradient(90deg, #09090b 1px, transparent 1px)', 
          backgroundSize: '64px 64px' 
        }} 
      />

      <div className="container-main" style={{ position: 'relative', paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)' }}>
        <div className="grid-hero" style={{ gap: '64px' }}>
          
          {/* Left Column: Typography & CTAs */}
          <div style={{ maxWidth: '580px' }}>
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
            >
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 12px', 
                  background: '#ffffff', 
                  borderRadius: '99px', 
                  border: '1px solid #e4e4e7', 
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  marginBottom: '24px' 
                }}
              >
                <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('hero.badge')}
                </span>
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ 
                fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', 
                fontWeight: 800, 
                color: '#09090b', 
                lineHeight: 1.08, 
                letterSpacing: '-0.03em' 
              }}
            >
              {t('hero.heading1')} <br/>
              <span style={{ color: '#10b981' }}>{t('hero.heading2')}</span>.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ marginTop: '24px', fontSize: '17px', color: '#52525b', lineHeight: 1.6 }}
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ marginTop: '36px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}
            >
              <Link 
                to="/scan" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '14px 28px', 
                  background: '#09090b', 
                  color: '#ffffff', 
                  fontWeight: 600, 
                  borderRadius: '12px', 
                  textDecoration: 'none', 
                  boxShadow: '0 4px 12px rgba(9, 9, 11, 0.15)',
                  transition: 'all 0.2s' 
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#27272a'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#09090b'; }}
              >
                <HiOutlineQrCode style={{ width: 18, height: 18 }} />
                {t('hero.ctaScan')}
              </Link>
              
              <Link 
                to="/manufacturer/dashboard" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '14px 28px', 
                  background: '#ffffff', 
                  color: '#27272a', 
                  fontWeight: 600, 
                  borderRadius: '12px', 
                  border: '1px solid #e4e4e7',
                  textDecoration: 'none', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s' 
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ffffff'; }}
              >
                <HiOutlineShieldCheck style={{ width: 18, height: 18 }} />
                {t('hero.ctaDashboard')}
                <HiOutlineArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Premium 3D-Like Mockup & Floating Elements */}
          <div 
            style={{ 
              position: 'relative', 
              display: 'flex', 
              justifyContent: 'center',
              perspective: 1000
            }}
            onMouseMove={handleMouse}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                aspectRatio: '1 / 1',
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                transition: 'all 0.1s ease-out'
              }}
            >
              {/* Diffused shadow card */}
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: '-20px', 
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))', 
                  borderRadius: '32px', 
                  filter: 'blur(30px)',
                  transform: 'translateZ(-40px)'
                }} 
              />

              {/* Product mockup container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  background: '#ffffff',
                  border: '1px solid #e4e4e7',
                  padding: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <img 
                  src="/hero_mockup.png" 
                  alt="SmartQR product packaging mockup"
                  style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'contain',
                    pointerEvents: 'none'
                  }}
                />

                {/* Ambient glow light streak */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)',
                    pointerEvents: 'none'
                  }}
                />
              </motion.div>

              {/* Floating QR Element 1 */}
              <motion.div
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="hero-floating-qr"
              >
                <div style={{ width: '100%', height: '100%', border: '2px solid #09090b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiOutlineQrCode style={{ width: '40px', height: '40px', color: '#09090b' }} />
                </div>
              </motion.div>

              {/* Floating Verification Tag */}
              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }}
                className="hero-floating-tag"
              >
                <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#09090b' }}>{t('hero.floatingTag')}</span>
              </motion.div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
