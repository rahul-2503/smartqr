import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBuildingOffice2, HiOutlineExclamationCircle, HiOutlineArrowRight, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import '../../manufacturer.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/manufacturer/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error is set in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfr-auth-page">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mfr-auth-card"
        style={{ position: 'relative', paddingTop: '56px' }}
      >
        <Link 
          to="/" 
          style={{ 
            position: 'absolute', 
            top: 24, 
            left: 24, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            color: 'var(--mfr-text-muted)', 
            textDecoration: 'none', 
            fontSize: '13px', 
            fontWeight: 500,
            zIndex: 10,
            cursor: 'pointer'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--mfr-text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--mfr-text-muted)'}
        >
          ← Back to Home
        </Link>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              background: 'var(--mfr-accent)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--mfr-shadow-sm)'
            }}
          >
            <HiOutlineBuildingOffice2 style={{ width: 24, height: 24, color: 'white' }} />
          </div>
        </div>

        <h1>Enterprise Portal</h1>
        <p className="subtitle">
          Sign in to manage your smart product labels and expiry alerts
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ 
                  background: 'var(--mfr-danger-bg)', 
                  border: '1px solid var(--mfr-danger-border)', 
                  padding: '12px 16px', 
                  borderRadius: 'var(--mfr-radius-md)', 
                  display: 'flex', 
                  gap: 10, 
                  alignItems: 'flex-start' 
                }}
              >
                <HiOutlineExclamationCircle style={{ width: 18, height: 18, color: 'var(--mfr-danger)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: '13px', color: 'var(--mfr-danger)', lineHeight: 1.4, fontWeight: 500 }}>{authError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mfr-auth-label">Organization Email</label>
            <input
              type="email" value={email} onChange={e => { setEmail(e.target.value); setAuthError(null); }}
              required placeholder="name@company.com"
              className="mfr-auth-input"
              id="login-email"
            />
          </div>

          <div>
            <label className="mfr-auth-label">Security Password</label>
            <input
              type="password" value={password} onChange={e => { setPassword(e.target.value); setAuthError(null); }}
              required placeholder="••••••••" minLength={6}
              className="mfr-auth-input"
              id="login-password"
            />
          </div>

          <button type="submit" disabled={loading} className="mfr-auth-btn" id="login-submit" style={{ marginTop: '8px' }}>
            {loading ? <><div className="mfr-spinner" /> Authenticating...</> : <>Enterprise Sign In <HiOutlineArrowRight style={{ width: 15, height: 15 }} /></>}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid var(--mfr-border)', paddingTop: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--mfr-text-secondary)', margin: 0 }}>
            New organization workspace? <br />
            <Link to="/manufacturer/register" className="mfr-auth-link" style={{ marginTop: '6px', display: 'inline-block' }}>
              Register your organization →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
