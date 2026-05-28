import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBuildingOffice2, HiOutlineExclamationCircle, HiOutlineArrowRight, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import '../../manufacturer.css';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgForm, setOrgForm] = useState({
    companyName: '', licenseNo: '', gstNo: '', address: '', state: '', contactName: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const { register, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const handleStep1 = (e) => {
    e.preventDefault();
    setAuthError(null);
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, orgForm);
      navigate('/manufacturer/dashboard');
    } catch (err) {
      if (err.message?.includes('already exists')) {
        setStep(1);
      }
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
        style={{ maxWidth: step === 2 ? 520 : 420, position: 'relative', paddingTop: '56px' }}
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

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
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

        {/* Step indicator progress bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: '24px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              width: s === step ? 28 : 8, height: 6, borderRadius: 3,
              background: s <= step ? 'var(--mfr-accent)' : 'var(--mfr-border)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        <h1>{step === 1 ? 'Create Workspace' : 'Organization Setup'}</h1>
        <p className="subtitle" style={{ marginBottom: '24px' }}>
          {step === 1 ? 'Get started with your company email credentials' : 'Register your company profile details'}
        </p>

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
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}
            >
              <HiOutlineExclamationCircle style={{ width: 18, height: 18, color: 'var(--mfr-danger)', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '13px', color: 'var(--mfr-danger)', lineHeight: 1.4, fontWeight: 500 }}>{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <label className="mfr-auth-label">Corporate Email Address</label>
                <input 
                  type="email" value={email} onChange={e => { setEmail(e.target.value); setAuthError(null); }}
                  required placeholder="e.g. admin@cipla.com" className="mfr-auth-input" id="register-email" 
                />
                <p style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HiOutlineCheckCircle style={{ width: 12, height: 12, color: 'var(--mfr-success)' }} />
                  Corporate or business email domain required.
                </p>
              </div>

              <div>
                <label className="mfr-auth-label">Choose Workspace Password</label>
                <input 
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="Minimum 6 characters" minLength={6} className="mfr-auth-input" id="register-password" 
                />
              </div>

              <button type="submit" className="mfr-auth-btn" style={{ marginTop: '8px' }}>
                Continue to Profile <HiOutlineArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="mfr-auth-label">Company Name *</label>
                  <input 
                    required value={orgForm.companyName} onChange={e => setOrgForm({...orgForm, companyName: e.target.value})}
                    placeholder="e.g. Cipla Ltd" className="mfr-auth-input" id="register-company" 
                  />
                </div>
                <div>
                  <label className="mfr-auth-label">Contact Name *</label>
                  <input 
                    required value={orgForm.contactName} onChange={e => setOrgForm({...orgForm, contactName: e.target.value})}
                    placeholder="Workspace admin name" className="mfr-auth-input" id="register-contact" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="mfr-auth-label">Drug License No.</label>
                  <input 
                    value={orgForm.licenseNo} onChange={e => setOrgForm({...orgForm, licenseNo: e.target.value})}
                    placeholder="e.g. DL-12345" className="mfr-auth-input" 
                  />
                </div>
                <div>
                  <label className="mfr-auth-label">GSTIN Number</label>
                  <input 
                    value={orgForm.gstNo} onChange={e => setOrgForm({...orgForm, gstNo: e.target.value})}
                    placeholder="e.g. 27GSTIN..." className="mfr-auth-input" 
                  />
                </div>
              </div>

              <div>
                <label className="mfr-auth-label">Manufacturing Site Address</label>
                <input 
                  value={orgForm.address} onChange={e => setOrgForm({...orgForm, address: e.target.value})}
                  placeholder="Facility location" className="mfr-auth-input" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="mfr-auth-label">State</label>
                  <select 
                    value={orgForm.state} onChange={e => setOrgForm({...orgForm, state: e.target.value})}
                    className="mfr-auth-input" style={{ cursor: 'pointer' }}
                  >
                    <option value="">Choose State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mfr-auth-label">Contact Phone</label>
                  <input 
                    value={orgForm.phone} onChange={e => setOrgForm({...orgForm, phone: e.target.value})}
                    placeholder="Workspace phone number" className="mfr-auth-input" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: '8px' }}>
                <button 
                  type="button" onClick={() => setStep(1)} className="mfr-auth-btn"
                  style={{ background: 'var(--mfr-bg-tertiary)', color: 'var(--mfr-text-primary)', flex: '0 0 auto', width: 'auto', padding: '12px 20px' }}
                >
                  Back
                </button>
                <button type="submit" disabled={loading} className="mfr-auth-btn" style={{ flex: 1 }} id="register-submit">
                  {loading ? <><div className="mfr-spinner" /> Launching...</> : <>Create Workspace <HiOutlineArrowRight style={{ width: 15, height: 15 }} /></>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--mfr-border)', paddingTop: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--mfr-text-secondary)', margin: 0 }}>
            Workspace already exists?{' '}
            <Link to="/manufacturer/login" className="mfr-auth-link">Sign in here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
