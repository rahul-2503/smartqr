import { motion } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineSpeakerWave, HiOutlineBellAlert, HiOutlineGlobeAlt, HiOutlineEye, HiOutlineChartBarSquare } from 'react-icons/hi2';

const features = [
  { icon: HiOutlineShieldCheck, title: 'Product Verification', description: 'Instantly verify product authenticity and batch details by scanning the QR code.', iconBg: '#f0fdf4', iconColor: '#16a34a' },
  { icon: HiOutlineSpeakerWave, title: 'Voice Accessibility', description: 'Tap the voice button to hear product details spoken aloud. Designed for elderly and visually challenged users.', iconBg: '#eff6ff', iconColor: '#3b82f6' },
  { icon: HiOutlineBellAlert, title: 'Expiry Intelligence', description: 'Real-time expiry calculation with color-coded status — Safe, Expiring Soon, or Expired.', iconBg: '#fffbeb', iconColor: '#d97706' },
  { icon: HiOutlineGlobeAlt, title: 'Cloud-Powered', description: 'Built on Azure Cosmos DB with serverless functions. Lightning-fast lookups with enterprise security.', iconBg: '#faf5ff', iconColor: '#9333ea' },
  { icon: HiOutlineEye, title: 'Product Traceability', description: 'Full batch-level traceability — know who made it, when, and when it expires.', iconBg: '#fff1f2', iconColor: '#e11d48' },
  { icon: HiOutlineChartBarSquare, title: 'Manufacturer Dashboard', description: 'A powerful yet simple dashboard to manage products, generate QR codes, and track lifecycles.', iconBg: '#ecfeff', iconColor: '#0891b2' },
];

export default function Features() {
  return (
    <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#f8f9fa' }}>
      <div className="container-main">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 80px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Capabilities</span>
          <h2 style={{ marginTop: 20, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Everything you need for<br />product safety.
          </h2>
          <p style={{ marginTop: 20, fontSize: 16, color: '#718096', lineHeight: 1.7 }}>A complete ecosystem connecting manufacturers with consumers through smart, accessible technology.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: i * 0.06 }}>
              <div style={{ padding: '28px', borderRadius: '16px', background: 'white', border: '1px solid #f1f3f5', height: '100%', transition: 'all 0.4s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#f1f3f5'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <f.icon style={{ width: 22, height: 22, color: f.iconColor }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7 }}>{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
