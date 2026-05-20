import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineQrCode, HiOutlineShieldCheck, HiOutlineArrowRight, HiOutlineBuildingOffice2 } from 'react-icons/hi2';

export default function Hero() {
  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: '80px', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 40%, #f1f5f9 100%)' }}>
      {/* Subtle enterprise grid background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container-main" style={{ position: 'relative', paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)' }}>
        
        {/* Header Text */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 64px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: '#e0f2fe', borderRadius: '999px', border: '1px solid #bae6fd', marginBottom: '24px' }}>
              <div style={{ width: 6, height: 6, background: '#0284c7', borderRadius: '50%' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Enterprise Product Intelligence</span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            The trusted network for <br/>
            <span style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>product safety</span> & expiry tracking.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ marginTop: '24px', fontSize: '18px', color: '#475569', lineHeight: 1.6 }}>
            Select your portal below. Consumers can instantly scan and verify products, while manufacturers access secure enterprise tools to manage batch integrity.
          </motion.p>
        </div>

        {/* Dual Portal Cards */}
        <div className="grid-2col" style={{ gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Consumer Portal Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ background: 'white', borderRadius: '24px', padding: '48px 40px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ width: 56, height: 56, background: '#f0fdf4', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <HiOutlineQrCode style={{ width: 28, height: 28, color: '#16a34a' }} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Consumer Access</h2>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, flex: 1, marginBottom: '40px' }}>
              Instantly scan any SmartQR code to verify product authenticity, check expiry dates, and receive critical safety alerts. Fast, free, and no account required.
            </p>

            <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 24px', background: '#16a34a', color: 'white', fontWeight: 600, borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s', width: '100%' }}>
              Start Scanning
              <HiOutlineArrowRight style={{ width: 18, height: 18 }} />
            </Link>
          </motion.div>

          {/* Manufacturer Portal Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            style={{ background: '#0f172a', borderRadius: '24px', padding: '48px 40px', border: '1px solid #1e293b', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
            
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

            <div style={{ width: 56, height: 56, background: '#1e293b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid #334155' }}>
              <HiOutlineBuildingOffice2 style={{ width: 28, height: 28, color: '#38bdf8' }} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Manufacturer Portal</h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, flex: 1, marginBottom: '40px' }}>
              Secure enterprise infrastructure for managing product intelligence. Upload metadata, manage batches, update expiry details, and track scan analytics.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/manufacturer/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 24px', background: '#38bdf8', color: '#0f172a', fontWeight: 700, borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s', width: '100%' }}>
                <HiOutlineShieldCheck style={{ width: 20, height: 20 }} />
                Secure Login
              </Link>
              <Link to="/manufacturer/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 24px', background: 'transparent', color: '#cbd5e1', fontWeight: 600, borderRadius: '12px', border: '1px solid #334155', textDecoration: 'none', transition: 'all 0.2s', width: '100%' }}>
                Register Organization
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
