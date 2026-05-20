import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineSpeakerWave, HiOutlineHandRaised, HiOutlineLanguage } from 'react-icons/hi2';

const points = [
  { icon: HiOutlineSpeakerWave, title: 'Voice Readout', description: 'Tap the speaker button to hear all product details spoken aloud. Perfect for visually challenged and elderly users.' },
  { icon: HiOutlineHandRaised, title: 'Large, Clear Interface', description: 'Big buttons, clear text, color-coded badges. No tiny fonts, no confusing layouts.' },
  { icon: HiOutlineLanguage, title: 'Simple & Universal', description: 'No login required. Just scan and know. Works on any phone with a camera.' },
];

export default function ForConsumers() {
  return (
    <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#f8f9fa' }}>
      <div className="container-main">
        <div className="grid-2col-reverse">
          {/* Left — Phone mockup */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7 }}
            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '-24px', background: 'linear-gradient(135deg, rgba(216,243,220,0.4), rgba(219,234,254,0.3))', borderRadius: '3rem', filter: 'blur(20px)' }} />

              <div style={{ position: 'relative', width: 280, background: '#1a1a2e', borderRadius: '2.5rem', padding: 10, boxShadow: '0 25px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ width: '100%', height: 500, background: 'white', borderRadius: '2.1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Status bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 24px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#4a5568' }}>9:41</span>
                    <div style={{ width: 64, height: 16, background: '#1a1a2e', borderRadius: 999 }} />
                    <div style={{ width: 24 }} />
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px 20px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Scan QR Code</p>

                    {/* Viewfinder */}
                    <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 20 }}>
                      {[{ t: 0, l: 0, br: 'tl' }, { t: 0, r: 0, br: 'tr' }, { b: 0, l: 0, br: 'bl' }, { b: 0, r: 0, br: 'br' }].map((pos, i) => (
                        <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...pos.t !== undefined && { top: pos.t }, ...pos.b !== undefined && { bottom: pos.b }, ...pos.l !== undefined && { left: pos.l }, ...pos.r !== undefined && { right: pos.r },
                          borderTop: pos.t !== undefined ? '3px solid #2d6a4f' : 'none', borderBottom: pos.b !== undefined ? '3px solid #2d6a4f' : 'none',
                          borderLeft: pos.l !== undefined ? '3px solid #2d6a4f' : 'none', borderRight: pos.r !== undefined ? '3px solid #2d6a4f' : 'none',
                          [`borderTop${pos.br === 'tl' || pos.br === 'tr' ? (pos.br === 'tl' ? 'Left' : 'Right') : ''}Radius`]: pos.br === 'tl' ? 8 : 0,
                          [`borderTop${pos.br === 'tr' ? 'Right' : pos.br === 'tl' ? 'Left' : ''}Radius`]: (pos.br === 'tl' || pos.br === 'tr') ? 8 : 0,
                          [`borderBottom${pos.br === 'bl' ? 'Left' : pos.br === 'br' ? 'Right' : ''}Radius`]: (pos.br === 'bl' || pos.br === 'br') ? 8 : 0,
                        }} />
                      ))}
                      <motion.div style={{ position: 'absolute', left: 12, right: 12, height: 2, background: 'rgba(45,106,79,0.5)', borderRadius: 999 }}
                        animate={{ top: ['10%', '85%', '10%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                    </div>

                    {/* Result card */}
                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}
                      style={{ width: '100%', background: '#f8f9fa', borderRadius: 16, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Paracetamol 500mg</p>
                          <p style={{ fontSize: 10, color: '#a0aec0' }}>Sun Pharma</p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', background: '#f0fdf4', color: '#166534', borderRadius: 999 }}>Safe</span>
                      </div>
                      <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                        <div><p style={{ fontSize: 9, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expires</p><p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>Jan 2026</p></div>
                        <div><p style={{ fontSize: 9, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Days Left</p><p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f' }}>231</p></div>
                      </div>
                      <button style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: '#2d6a4f', color: 'white', borderRadius: 12, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                        <HiOutlineSpeakerWave style={{ width: 14, height: 14 }} /> Read Aloud
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — Content */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7, delay: 0.15 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.2em' }}>For Consumers</span>
            <h2 style={{ marginTop: 20, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Designed for everyone.<br />Especially those who<br />need it most.
            </h2>
            <p style={{ marginTop: 20, fontSize: 16, color: '#718096', lineHeight: 1.7, maxWidth: 420 }}>
              We built SmartQR with accessibility at its core — because product safety is a right, not a privilege.
            </p>

            <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 28 }}>
              {points.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon style={{ width: 20, height: 20, color: '#2d6a4f' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{item.title}</h4>
                    <p style={{ fontSize: 14, color: '#718096', marginTop: 4, lineHeight: 1.6 }}>{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} style={{ marginTop: 40 }}>
              <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}>
                Try Scanning Now
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
