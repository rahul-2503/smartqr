import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBatchById } from '../api/manufacturerApi';
import { useLanguage } from '../i18n/LanguageContext';
import {
  HiOutlineSpeakerWave, HiOutlineShieldCheck, HiOutlineClock,
  HiOutlineExclamationTriangle, HiOutlineArrowLeft, HiOutlineQrCode,
} from 'react-icons/hi2';

const formatDateForSpeech = (dateStr, lang) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  try {
    return date.toLocaleDateString(lang === 'en' ? 'en-IN' : lang, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const getBestVoice = (lang, speechLang) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const cleanLang = lang.toLowerCase().trim();
  const cleanSpeechLang = speechLang.toLowerCase().replace('_', '-').trim();
  const norm = (l) => l.toLowerCase().replace('_', '-').trim();

  // 1. Try exact speechLang match (e.g. hi-in)
  let voice = voices.find(v => norm(v.lang) === cleanSpeechLang);
  if (voice) return voice;

  // 2. Try match on lang prefix (e.g. hi)
  voice = voices.find(v => norm(v.lang).startsWith(cleanLang));
  if (voice) return voice;

  // 3. Try match where language code contains language code
  voice = voices.find(v => norm(v.lang).includes(cleanLang));
  if (voice) return voice;

  // 4. Try matching voice name case-insensitively using language-specific keywords
  const langNameMap = {
    hi: ['hindi', 'हिन्दी', 'hi-'],
    te: ['telugu', 'తెలుగు', 'te-'],
    kn: ['kannada', 'ಕನ್ನಡ', 'kn-'],
    en: ['english', 'en-']
  };

  const keywords = langNameMap[cleanLang] || [cleanLang];
  voice = voices.find(v => {
    const name = v.name.toLowerCase();
    const vlang = norm(v.lang);
    return keywords.some(kw => name.includes(kw) || vlang.includes(kw));
  });

  return voice || null;
};

export default function ProductDetail() {
  const { t, speechLang, lang } = useLanguage();

  const STATUS_CONFIG = {
    SAFE: { label: t('productDetail.statusSafe'), bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0', icon: HiOutlineShieldCheck, iconColor: '#16a34a', gradient: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' },
    EXPIRING_SOON: { label: t('productDetail.statusExpiring'), bg: '#fffbeb', fg: '#92400e', border: '#fde68a', icon: HiOutlineClock, iconColor: '#d97706', gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
    EXPIRED: { label: t('productDetail.statusExpired'), bg: '#fef2f2', fg: '#991b1b', border: '#fecaca', icon: HiOutlineExclamationTriangle, iconColor: '#dc2626', gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
  };

  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const cellScanned = searchParams.get('cell');
  const stripScanned = searchParams.get('strip');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pre-load voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
      };
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const result = await getBatchById(batchId);
        // Merge batch, product, and manufacturer data for display
        const batch = result.batch || {};
        const product = result.product || {};
        const manufacturer = result.manufacturer || {};

        const expDate = new Date(batch.exp_date);
        const today = new Date();
        const daysLeft = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
        let status = 'SAFE';
        if (daysLeft < 0) status = 'EXPIRED';
        else if (daysLeft <= 90) status = 'EXPIRING_SOON';

        setData({
          product_name: product.medicine_name || batch.product_name || 'Unknown Product',
          generic_name: product.generic_name || '',
          manufacturer: manufacturer.company_name || batch.organizationName || product.organizationName || 'Unknown Manufacturer',
          category: product.category || '',
          dosage: product.dosage || '',
          type: product.type || '',
          composition: product.composition || '',
          batch_id: batch.batch_id,
          mfg_date: batch.mfg_date,
          exp_date: batch.exp_date,
          days_left: daysLeft,
          status: status,
          instructions: product.dosage_instructions || '',
          warnings: batch.warnings || product.contraindications || '',
          side_effects: product.side_effects || '',
          storage: product.storage || '',
          mrp: batch.mrp || '',
          prescription_required: product.prescription_required || false,
          tablets_per_strip: batch.tablets_per_strip,
          total_strips: batch.total_strips,
        });

        // Record scan event in background
        (async () => {
          try {
            let geoData = {};
            try {
              const geoRes = await fetch('https://ipapi.co/json/');
              if (geoRes.ok) geoData = await geoRes.json();
            } catch (geoErr) {
              console.warn('Geo IP lookup failed', geoErr);
            }

            const recordUrl = import.meta.env.VITE_API_BASE
              ? `${import.meta.env.VITE_API_BASE}/recordscan`
              : (
                (window.location.hostname === 'localhost' && !navigator.webdriver)
                  ? 'http://localhost:7071/api/recordscan'
                  : 'https://smartqr-api-rahul-f8hpaqeudbdeesa5.centralindia-01.azurewebsites.net/api/recordscan'
              );


            await fetch(recordUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batchId: batch.batch_id,
                productName: product.medicine_name || batch.product_name || 'Unknown Product',
                organizationDomain: batch.organizationDomain || batch.mfr_id,
                city: geoData.city || 'Unknown City',
                region: geoData.region || 'Unknown Region',
                country: geoData.country_name || geoData.country || 'Unknown Country',
                latitude: geoData.latitude || null,
                longitude: geoData.longitude || null
              })
            });
          } catch (scanErr) {
            console.error('Failed to log scan:', scanErr);
          }
        })();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [batchId]);

  const speakProduct = () => {
    if (!data || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const st = data.status === 'SAFE' 
      ? t('productDetail.speechSafe', { days: data.days_left })
      : data.status === 'EXPIRING_SOON' 
        ? t('productDetail.speechExpiring', { days: data.days_left })
        : t('productDetail.speechExpired', { days: Math.abs(data.days_left) });
    
    const formattedMfg = formatDateForSpeech(data.mfg_date, lang);
    const formattedExp = formatDateForSpeech(data.exp_date, lang);
    
    let text = t('productDetail.speechIntro', { product: data.product_name, manufacturer: data.manufacturer });
    if (data.category) text += ' ' + t('productDetail.speechCategory', { category: data.category });
    text += ' ' + t('productDetail.speechMfg', { mfgDate: formattedMfg, expDate: formattedExp });
    text += ' ' + t('productDetail.speechStatus', { status: st });
    if (data.instructions) text += ' ' + t('productDetail.speechInstructions', { instructions: data.instructions });
    if (data.warnings) text += ' ' + t('productDetail.speechWarnings', { warnings: data.warnings });
    
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;
    
    const voice = getBestVoice(lang, speechLang);
    if (voice) {
      u.voice = voice;
    }
    
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const infoBox = { background: '#f8f9fa', borderRadius: 16, padding: 16, textAlign: 'center' };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', paddingTop: 80 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, margin: '0 auto', border: '3px solid #d8f3dc', borderTopColor: '#2d6a4f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: 16, fontSize: 14, color: '#718096' }}>{t('productDetail.loading')}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', paddingTop: 80 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <HiOutlineExclamationTriangle style={{ width: 64, height: 64, color: '#a0aec0', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{t('productDetail.notFound')}</h2>
          <p style={{ fontSize: 14, color: '#718096', marginBottom: 24 }}>{error}</p>
          <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 12, textDecoration: 'none' }}>
            <HiOutlineQrCode style={{ width: 20, height: 20 }} /> {t('productDetail.scanAnother')}
          </Link>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[data.status];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingTop: 'var(--page-top, 80px)', paddingBottom: 'var(--page-bottom, 48px)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
        <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#a0aec0', textDecoration: 'none', marginBottom: 24, transition: 'color 0.2s' }}
          onMouseEnter={e => e.target.style.color = '#2d6a4f'} onMouseLeave={e => e.target.style.color = '#a0aec0'}>
          <HiOutlineArrowLeft style={{ width: 16, height: 16 }} /> {t('productDetail.backToScanner')}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #f1f3f5', overflow: 'hidden' }}>
          {/* Status banner */}
          <div style={{ padding: 32, background: config.gradient }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <config.icon style={{ width: 40, height: 40, color: config.iconColor }} />
              <span style={{ padding: '6px 16px', fontSize: 14, fontWeight: 700, borderRadius: 999, background: config.bg, color: config.fg, border: `1px solid ${config.border}` }}>
                {config.label}
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: '#1a1a2e' }}>{data.product_name}</h1>
            <p style={{ fontSize: 16, color: '#718096', marginTop: 4 }}>
              {data.manufacturer}{data.category ? ` · ${data.category}` : ''}{data.dosage ? ` · ${data.dosage}` : ''}
            </p>
            {data.prescription_required && (
              <span style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', borderRadius: 999, border: '1px solid #fde68a' }}>
                ⚕ {t('productDetail.prescriptionRequired')}
              </span>
            )}
          </div>

          {/* Details */}
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid-info-3col">
              {[
                { l: t('productDetail.batchId'), v: data.batch_id },
                { l: t('productDetail.mfgDate'), v: data.mfg_date },
                { l: t('productDetail.expDate'), v: data.exp_date }
              ].map(i => (
                <div key={i.l} style={infoBox}>
                  <p style={{ fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{i.l}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{i.v}</p>
                </div>
              ))}
            </div>

            {cellScanned && stripScanned && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#f8fafc', color: '#334155', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                {t('scanner.tablet')} {cellScanned} {t('scanner.ofStrip')} {stripScanned}
              </div>
            )}

            <div style={{ ...infoBox, padding: 24 }}>
              <p style={{ fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                {data.days_left >= 0 ? t('productDetail.daysRemaining') : t('productDetail.daysSinceExpiry')}
              </p>
              <p style={{ fontSize: 48, fontWeight: 800, color: config.iconColor }}>{Math.abs(data.days_left)}</p>
            </div>

            {data.mrp && (
              <div style={infoBox}>
                <p style={{ fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t('productDetail.mrpPerStrip')}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>₹{data.mrp}</p>
              </div>
            )}

            {data.composition && (
              <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 16, border: '1px solid #e0f2fe' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: 8 }}>{t('productDetail.composition')}</p>
                <p style={{ fontSize: 14, color: '#0c4a6e', lineHeight: 1.7 }}>{data.composition}</p>
              </div>
            )}

            {data.instructions && (
              <div style={{ padding: 20, background: '#eff6ff', borderRadius: 16, border: '1px solid #dbeafe' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 8 }}>{t('productDetail.dosageInstructions')}</p>
                <p style={{ fontSize: 14, color: '#1e40af', lineHeight: 1.7 }}>{data.instructions}</p>
              </div>
            )}

            {data.storage && (
              <div style={{ padding: 20, background: '#faf5ff', borderRadius: 16, border: '1px solid #e9d5ff' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8 }}>{t('productDetail.storage')}</p>
                <p style={{ fontSize: 14, color: '#5b21b6', lineHeight: 1.7 }}>{data.storage}</p>
              </div>
            )}

            {data.side_effects && (
              <div style={{ padding: 20, background: '#fff7ed', borderRadius: 16, border: '1px solid #fed7aa' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', marginBottom: 8 }}>{t('productDetail.sideEffects')}</p>
                <p style={{ fontSize: 14, color: '#9a3412', lineHeight: 1.7 }}>{data.side_effects}</p>
              </div>
            )}

            {data.warnings && (
              <div style={{ padding: 20, background: '#fef2f2', borderRadius: 16, border: '1px solid #fecaca' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 8 }}>⚠️ {t('productDetail.warning')}</p>
                <p style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.7 }}>{data.warnings}</p>
              </div>
            )}

            <button onClick={speakProduct}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 0', background: '#2d6a4f', color: 'white', fontSize: 18, fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}>
              <HiOutlineSpeakerWave style={{ width: 24, height: 24 }} /> {t('productDetail.readAloud')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
