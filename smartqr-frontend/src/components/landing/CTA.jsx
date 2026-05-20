import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineQrCode, HiOutlineArrowRight } from 'react-icons/hi2';

export default function CTA() {
  return (
    <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#ffffff' }}>
      <div className="container-narrow">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7 }}
          style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: '#2d6a4f', padding: '64px', textAlign: 'center' }}>
          {/* Glow */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 256, height: 256, background: '#40916c', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 192, height: 192, background: '#95d5b2', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.2 }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 32px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiOutlineQrCode style={{ width: 28, height: 28, color: 'white' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Ready to make your products<br />smarter and safer?
            </h2>
            <p style={{ marginTop: 20, fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 440, margin: '20px auto 0', lineHeight: 1.7 }}>
              Join the movement for product transparency. Whether you manufacture or consume — SmartQR has you covered.
            </p>
            <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'white', color: '#2d6a4f', fontWeight: 600, borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                Start as Manufacturer <HiOutlineArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', fontWeight: 600, borderRadius: 12, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)' }}>
                Scan a Product
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
