import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBuildingOffice2, HiOutlineExclamationCircle, HiOutlineArrowRight } from 'react-icons/hi2';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/manufacturer/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEnterpriseLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation is handled by the onAuthStateChanged listener
    } catch (err) {
      console.error(err);
      setError('Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 24, padding: 48, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: '#0f172a', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            <HiOutlineBuildingOffice2 style={{ width: 32, height: 32, color: '#38bdf8' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Enterprise Portal</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Secure access via Firebase Authentication</p>
        </div>

        <form onSubmit={handleEnterpriseLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <HiOutlineExclamationCircle style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5, fontWeight: 500 }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@company.com"
              style={{ width: '100%', padding: '14px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, fontSize: 15, color: '#0f172a', outline: 'none', transition: 'all 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <Link to="#" style={{ fontSize: 13, color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '14px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, fontSize: 15, color: '#0f172a', outline: 'none', transition: 'all 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: '#0f172a', color: 'white', fontWeight: 600, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            {loading ? 'Authenticating...' : <>Enterprise Sign In <HiOutlineArrowRight style={{ width: 16, height: 16 }} /></>}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 32 }}>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Is your organization new to SmartQR? <br />
            <Link to="/manufacturer/register" style={{ color: '#0f172a', fontWeight: 700, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Register your organization</Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}
