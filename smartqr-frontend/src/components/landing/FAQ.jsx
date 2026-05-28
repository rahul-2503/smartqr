import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import { useLanguage } from '../../i18n/LanguageContext';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const { t } = useLanguage();

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
    { question: t('faq.q6'), answer: t('faq.a6') },
  ];

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section
      id="faq"
      style={{
        paddingTop: 'var(--section-padding)',
        paddingBottom: 'var(--section-padding)',
        background: '#ffffff',
      }}
    >
      <div className="container-narrow">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: 56 }}
        >
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 800,
              color: '#1a1a2e',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {t('faq.heading')}
          </h2>
        </motion.div>

        {/* Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              {/* Top border for first item, otherwise separator between items */}
              <div
                style={{
                  borderTop: '1px solid #e5e7eb',
                  ...(i === faqs.length - 1
                    ? { borderBottom: '1px solid #e5e7eb' }
                    : {}),
                }}
              >
                {/* Question Button */}
                <button
                  id={`faq-toggle-${i}`}
                  onClick={() => toggle(i)}
                  aria-expanded={openIndex === i}
                  aria-controls={`faq-panel-${i}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('.faq-q-text').style.color =
                      '#2d6a4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('.faq-q-text').style.color =
                      openIndex === i ? '#2d6a4f' : '#1a1a2e';
                  }}
                >
                  <span
                    className="faq-q-text"
                    style={{
                      fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                      fontWeight: 600,
                      color: openIndex === i ? '#2d6a4f' : '#1a1a2e',
                      transition: 'color 0.25s ease',
                      paddingRight: 16,
                      lineHeight: 1.5,
                    }}
                  >
                    {faq.question}
                  </span>

                  <motion.span
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      color: openIndex === i ? '#2d6a4f' : '#718096',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    <HiOutlineChevronDown style={{ width: 20, height: 20 }} />
                  </motion.span>
                </button>

                {/* Answer Panel */}
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-toggle-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p
                        style={{
                          paddingBottom: 24,
                          fontSize: 'clamp(0.875rem, 1.8vw, 0.95rem)',
                          color: '#4a5568',
                          lineHeight: 1.8,
                          maxWidth: '85%',
                        }}
                      >
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
