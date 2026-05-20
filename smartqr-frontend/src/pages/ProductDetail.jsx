import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProduct } from '../api/products';
import {
  HiOutlineSpeakerWave, HiOutlineShieldCheck, HiOutlineClock,
  HiOutlineExclamationTriangle, HiOutlineArrowLeft, HiOutlineQrCode,
} from 'react-icons/hi2';

const STATUS_CONFIG = {
  SAFE: { label: 'Safe to Use', bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0', icon: HiOutlineShieldCheck, iconColor: '#16a34a', gradient: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' },
  EXPIRING_SOON: { label: 'Expiring Soon', bg: '#fffbeb', fg: '#92400e', border: '#fde68a', icon: HiOutlineClock, iconColor: '#d97706', gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
  EXPIRED: { label: 'Expired — Do Not Use', bg: '#fef2f2', fg: '#991b1b', border: '#fecaca', icon: HiOutlineExclamationTriangle, iconColor: '#dc2626', gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
};

export default function ProductDetail() {
  const { batchId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try { setProduct(await getProduct(batchId)); }
      catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [batchId]);

  const speakProduct = () => {
    if (!product || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const st = product.status === 'SAFE' ? `safe to use with ${product.days_left} days remaining` : product.status === 'EXPIRING_SOON' ? `expiring soon with only ${product.days_left} days remaining` : `expired ${Math.abs(product.days_left)} days ago. Do not consume.`;
    const text = `This is ${product.product_name}, manufactured by ${product.manufacturer}. Category: ${product.category}. Manufactured on ${product.mfg_date}, expires on ${product.exp_date}. Status: ${st}. ${product.instructions ? `Instructions: ${product.instructions}.` : ''} ${product.warnings ? `Warning: ${product.warnings}.` : ''}`;
    const u = new SpeechSynthesisUtterance(text); u.rate = 0.9; window.speechSynthesis.speak(u);
  };

  const infoBox = { background: '#f8f9fa', borderRadius: 16, padding: 16, textAlign: 'center' };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', paddingTop: 80 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, margin: '0 auto', border: '3px solid #d8f3dc', borderTopColor: '#2d6a4f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: 16, fontSize: 14, color: '#718096' }}>Loading product details...</p>
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
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Product Not Found</h2>
          <p style={{ fontSize: 14, color: '#718096', marginBottom: 24 }}>{error}</p>
          <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 12, textDecoration: 'none' }}>
            <HiOutlineQrCode style={{ width: 20, height: 20 }} /> Scan Another Product
          </Link>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[product.status];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingTop: 'var(--page-top)', paddingBottom: 'var(--page-bottom)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
        <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#a0aec0', textDecoration: 'none', marginBottom: 24, transition: 'color 0.2s' }}
          onMouseEnter={e => e.target.style.color = '#2d6a4f'} onMouseLeave={e => e.target.style.color = '#a0aec0'}>
          <HiOutlineArrowLeft style={{ width: 16, height: 16 }} /> Back to Scanner
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
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: '#1a1a2e' }}>{product.product_name}</h1>
            <p style={{ fontSize: 16, color: '#718096', marginTop: 4 }}>{product.manufacturer} · {product.category}</p>
          </div>

          {/* Details */}
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid-info-3col">
              {[{ l: 'Batch ID', v: product.batch_id }, { l: 'MFG Date', v: product.mfg_date }, { l: 'EXP Date', v: product.exp_date }].map(i => (
                <div key={i.l} style={infoBox}>
                  <p style={{ fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{i.l}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{i.v}</p>
                </div>
              ))}
            </div>

            <div style={{ ...infoBox, padding: 24 }}>
              <p style={{ fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                {product.days_left >= 0 ? 'Days Remaining Until Expiry' : 'Days Since Expiry'}
              </p>
              <p style={{ fontSize: 48, fontWeight: 800, color: config.iconColor }}>{Math.abs(product.days_left)}</p>
            </div>

            {product.instructions && (
              <div style={{ padding: 20, background: '#eff6ff', borderRadius: 16, border: '1px solid #dbeafe' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 8 }}>Instructions</p>
                <p style={{ fontSize: 14, color: '#1e40af', lineHeight: 1.7 }}>{product.instructions}</p>
              </div>
            )}

            {product.warnings && (
              <div style={{ padding: 20, background: '#fef2f2', borderRadius: 16, border: '1px solid #fecaca' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 8 }}>⚠️ Warning</p>
                <p style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.7 }}>{product.warnings}</p>
              </div>
            )}

            <button onClick={speakProduct}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 0', background: '#2d6a4f', color: 'white', fontSize: 18, fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}>
              <HiOutlineSpeakerWave style={{ width: 24, height: 24 }} /> Read Aloud
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
