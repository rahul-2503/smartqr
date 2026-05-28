import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChevronDown } from 'react-icons/hi2';

const faqs = [
  {
    question: 'What is SmartQR?',
    answer:
      'SmartQR is a product transparency platform that connects manufacturers with consumers through intelligent QR codes. Each QR code is linked to real-time product data — including batch details, manufacturing dates, and expiry information — so consumers can instantly verify authenticity and safety.',
  },
  {
    question: 'Is SmartQR free to use for consumers?',
    answer:
      'Yes, scanning and verifying products through SmartQR is completely free for consumers. Simply scan any SmartQR-enabled product label to instantly access batch details, expiry status, and safety information — no account or registration required.',
  },
  {
    question: 'How does expiry intelligence work?',
    answer:
      'SmartQR calculates the real-time expiry status of every product by comparing its manufacturing date, shelf life, and the current date. Products are color-coded as Safe (green), Expiring Soon (amber), or Expired (red), giving you an instant visual indicator of product safety.',
  },
  {
    question: 'Can I use SmartQR for my manufacturing business?',
    answer:
      'Absolutely. SmartQR provides a dedicated Manufacturer Portal where you can register your products, create batches, generate branded QR codes, and track product lifecycles — all from a single, easy-to-use dashboard. It is built on Azure Cloud for enterprise-grade reliability.',
  },
  {
    question: 'What is the voice accessibility feature?',
    answer:
      'SmartQR includes a built-in text-to-speech feature that reads product details aloud when you tap the voice button. This is designed specifically for elderly users and people with visual impairments, ensuring product safety information is accessible to everyone.',
  },
  {
    question: 'How secure is the data on SmartQR?',
    answer:
      'All data is stored on Azure Cosmos DB with enterprise-level encryption and security. Manufacturer accounts are protected with JWT-based authentication, and all API communication is encrypted end-to-end. We never share your data with third parties.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

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
            Frequently asked questions
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
