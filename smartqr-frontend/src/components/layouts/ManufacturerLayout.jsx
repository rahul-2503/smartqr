import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineArrowRightOnRectangle, HiOutlineSquares2X2, HiOutlineDocumentText } from 'react-icons/hi2';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function ManufacturerLayout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register');

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>Loading...</div>;
  }

  const content = (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Enterprise Top Navigation */}
      {!isAuthPage && (
        <header style={{ background: '#0f172a', color: 'white', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <Link to="/manufacturer/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'white' }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiOutlineShieldCheck style={{ color: 'white', width: 20, height: 20 }} />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', display: 'block' }}>SmartQR Enterprise</span>
                  <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>{user ? user.email : 'Manufacturer Portal'}</span>
                </div>
              </Link>

              <nav style={{ display: 'flex', gap: 8 }} className="hidden md:flex">
                <Link to="/manufacturer/dashboard" style={{ padding: '8px 12px', color: location.pathname === '/manufacturer/dashboard' ? 'white' : '#94a3b8', background: location.pathname === '/manufacturer/dashboard' ? '#1e293b' : 'transparent', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineSquares2X2 /> Operations
                </Link>
                <Link to="/manufacturer/audit" style={{ padding: '8px 12px', color: location.pathname === '/manufacturer/audit' ? 'white' : '#94a3b8', background: location.pathname === '/manufacturer/audit' ? '#1e293b' : 'transparent', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineDocumentText /> Audit Logs
                </Link>
              </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16, borderRight: '1px solid #1e293b' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>Firebase Auth</span>
              </div>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Sign Out <HiOutlineArrowRightOnRectangle />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );

  if (isAuthPage) {
    return content;
  }

  return user ? content : <Navigate to="/manufacturer/login" replace />;
}
