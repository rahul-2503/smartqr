import { motion } from 'framer-motion';
import {
  HiOutlineLightBulb, HiOutlineShieldCheck, HiOutlineSpeakerWave,
  HiOutlineEye, HiOutlineBolt, HiOutlineGlobeAlt,
  HiOutlineExclamationTriangle, HiOutlineCubeTransparent,
} from 'react-icons/hi2';
import { useLanguage } from '../i18n/LanguageContext';

const tech = ['Azure Functions', 'Azure Cosmos DB', 'Azure Static Web Apps', 'React', 'Tailwind CSS', 'Framer Motion'];

export default function About() {
  const { t } = useLanguage();

  const values = [
    { icon: HiOutlineShieldCheck, title: t('about.v1Title'), description: t('about.v1Desc'), iconBg: '#f0fdf4', iconColor: '#16a34a' },
    { icon: HiOutlineSpeakerWave, title: t('about.v2Title'), description: t('about.v2Desc'), iconBg: '#eff6ff', iconColor: '#3b82f6' },
    { icon: HiOutlineEye, title: t('about.v3Title'), description: t('about.v3Desc'), iconBg: '#faf5ff', iconColor: '#9333ea' },
    { icon: HiOutlineGlobeAlt, title: t('about.v4Title'), description: t('about.v4Desc'), iconBg: '#fffbeb', iconColor: '#d97706' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 'var(--section-padding)', background: 'linear-gradient(135deg, #f0faf4 0%, #ffffff 40%, #eef6ff 100%)' }}>
        <div className="container-main" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'white', borderRadius: 999, border: '1px solid #d8f3dc', marginBottom: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <HiOutlineLightBulb style={{ width: 16, height: 16, color: '#2d6a4f' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2d6a4f' }}>{t('about.badge')}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {t('about.heading')}
            </h1>
            <p style={{ maxWidth: 560, margin: '20px auto 0', fontSize: 18, color: '#718096', lineHeight: 1.7 }}>
              {t('about.intro')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Problem */}
      <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#ffffff' }}>
        <div className="container-main">
          <div className="grid-2col">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{t('about.problemLabel')}</span>
              <h2 style={{ marginTop: 16, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                {t('about.problemHeading')}
              </h2>
              <p style={{ marginTop: 20, fontSize: 16, color: '#718096', lineHeight: 1.7 }}>
                {t('about.problemDesc')}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div style={{ background: '#fef2f2', borderRadius: 20, padding: 32, border: '1px solid #fecaca' }}>
                {[
                  { icon: '💊', text: t('about.problemPoint1') },
                  { icon: '👴', text: t('about.problemPoint2') },
                  { icon: '⚠️', text: t('about.problemPoint3') },
                  { icon: '🌍', text: t('about.problemPoint4') },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(239,68,68,0.1)' : 'none' }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 500 }}>{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#f8f9fa' }}>
        <div className="container-main" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{t('about.solutionLabel')}</span>
            <h2 style={{ marginTop: 16, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>
              {t('about.solutionHeading')}
            </h2>
            <p style={{ maxWidth: 560, margin: '20px auto 0', fontSize: 16, color: '#718096', lineHeight: 1.7 }}>
              {t('about.solutionDesc')}
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 56 }}>
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <div style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #f1f3f5', height: '100%', textAlign: 'left', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: v.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <v.icon style={{ width: 22, height: 22, color: v.iconColor }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7 }}>{v.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#ffffff' }}>
        <div className="container-main" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{t('about.techLabel')}</span>
            <h2 style={{ marginTop: 16, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#1a1a2e' }}>{t('about.techHeading')}</h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            {tech.map(techItem => (
              <span key={techItem} style={{ padding: '10px 20px', borderRadius: 999, background: '#f8f9fa', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#1a1a2e', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.background = '#2d6a4f'; e.target.style.color = 'white'; e.target.style.borderColor = '#2d6a4f'; }}
                onMouseLeave={e => { e.target.style.background = '#f8f9fa'; e.target.style.color = '#1a1a2e'; e.target.style.borderColor = '#e2e8f0'; }}>
                {techItem}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mini CTA */}
      <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#f8f9fa' }}>
        <div className="container-narrow" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#1a1a2e' }}>{t('about.ctaHeading')}</h2>
            <p style={{ marginTop: 12, fontSize: 16, color: '#718096' }}>{t('about.ctaSubtitle')}</p>
            <div className="flex-responsive" style={{ justifyContent: 'center', marginTop: 32 }}>
              <a href="/scan" style={{ padding: '14px 28px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 12px rgba(45,106,79,0.2)' }}>{t('about.ctaScan')}</a>
              <a href="/dashboard" style={{ padding: '14px 28px', background: 'white', color: '#1a1a2e', fontWeight: 600, borderRadius: 12, textDecoration: 'none', border: '1px solid #e2e8f0' }}>{t('about.ctaDashboard')}</a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
