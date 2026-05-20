import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineArrowUpTray, HiOutlineQrCode, HiOutlinePrinter, HiOutlineChartBar } from 'react-icons/hi2';

const benefits = [
  { icon: HiOutlineArrowUpTray, title: 'Easy Onboarding', description: 'Upload product details through a simple form. No technical expertise required.' },
  { icon: HiOutlineQrCode, title: 'Instant QR Generation', description: 'Get a unique, printable QR code for each product batch automatically.' },
  { icon: HiOutlinePrinter, title: 'Print & Attach', description: 'Print QR labels and attach to any packaging — tablets, bottles, cosmetics.' },
  { icon: HiOutlineChartBar, title: 'Build Consumer Trust', description: 'Increase transparency and brand credibility. Consumers verify your product instantly.' },
];

export default function ForManufacturers() {
  return (
    <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#ffffff' }}>
      <div className="container-main">
        <div className="grid-2col">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.2em' }}>For Manufacturers</span>
            <h2 style={{ marginTop: 20, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Build trust with every<br />product you ship.
            </h2>
            <p style={{ marginTop: 20, fontSize: 16, color: '#718096', lineHeight: 1.7, maxWidth: 420 }}>
              Small and medium manufacturers can onboard in minutes. Upload details, generate smart QR labels, and give your customers confidence.
            </p>

            <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {benefits.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon style={{ width: 20, height: 20, color: '#2d6a4f' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{item.title}</h4>
                    <p style={{ fontSize: 14, color: '#718096', marginTop: 2, lineHeight: 1.6 }}>{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} style={{ marginTop: 40 }}>
              <Link to="/manufacturer/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}>
                Manufacturer Portal
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — Dashboard preview */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7, delay: 0.15 }}
            style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-16px', background: 'linear-gradient(135deg, rgba(240,253,244,0.6), rgba(239,246,255,0.4))', borderRadius: '2rem', filter: 'blur(16px)' }} />
            <div style={{ position: 'relative', background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid #f1f3f5', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f3f5' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Product Dashboard</h3>
                  <p style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>3 products registered</p>
                </div>
                <div style={{ padding: '8px 14px', background: '#2d6a4f', color: 'white', fontSize: 12, fontWeight: 600, borderRadius: 8 }}>+ Add Product</div>
              </div>
              {[
                { name: 'Paracetamol 500mg', batch: 'BATCH001', status: 'Safe', bg: '#f0fdf4', fg: '#166534', days: '231 days' },
                { name: 'Amoxicillin 250mg', batch: 'BATCH002', status: 'Expiring Soon', bg: '#fffbeb', fg: '#92400e', days: '28 days' },
                { name: 'Cough Syrup 100ml', batch: 'BATCH003', status: 'Expired', bg: '#fef2f2', fg: '#991b1b', days: '−12 days' },
              ].map((p, i) => (
                <motion.div key={p.batch} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < 2 ? '1px solid #f8f9fa' : 'none' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{p.batch}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#a0aec0' }}>{p.days}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: p.bg, color: p.fg }}>{p.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
