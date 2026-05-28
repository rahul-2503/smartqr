import { motion } from 'framer-motion';
import { HiOutlineCloudArrowUp, HiOutlineQrCode, HiOutlineDevicePhoneMobile } from 'react-icons/hi2';
import { useLanguage } from '../../i18n/LanguageContext';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { icon: HiOutlineCloudArrowUp, step: '01', title: t('howItWorks.step1Title'), description: t('howItWorks.step1Desc'), iconBg: '#eff6ff', iconColor: '#3b82f6', border: '#dbeafe' },
    { icon: HiOutlineQrCode, step: '02', title: t('howItWorks.step2Title'), description: t('howItWorks.step2Desc'), iconBg: '#f0fdf4', iconColor: '#2d6a4f', border: '#d8f3dc' },
    { icon: HiOutlineDevicePhoneMobile, step: '03', title: t('howItWorks.step3Title'), description: t('howItWorks.step3Desc'), iconBg: '#fffbeb', iconColor: '#d97706', border: '#fde68a' },
  ];

  return (
    <section style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)', background: '#ffffff' }}>
      <div className="container-main">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 80px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{t('howItWorks.label')}</span>
          <h2 style={{ marginTop: 20, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {t('howItWorks.heading1')}<br />{t('howItWorks.heading2')}
          </h2>
          <p style={{ marginTop: 20, fontSize: 16, color: '#718096', lineHeight: 1.7 }}>{t('howItWorks.subtitle')}</p>
        </motion.div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {steps.map((step, i) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.12 }}>
              <div style={{ position: 'relative', padding: '32px', borderRadius: '16px', background: 'white', border: `1px solid ${step.border}`, height: '100%', transition: 'box-shadow 0.5s, transform 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <span style={{ position: 'absolute', top: 16, right: 24, fontSize: '5rem', fontWeight: 900, color: '#f8f9fa', lineHeight: 1, userSelect: 'none' }}>{step.step}</span>
                <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 12, background: step.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <step.icon style={{ width: 24, height: 24, color: step.iconColor }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7 }}>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
