import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSquares2X2, HiOutlineCube, HiOutlineArchiveBox,
  HiOutlineQrCode, HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck, HiOutlineBars3, HiOutlineXMark
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import '../../manufacturer.css';

const NAV_ITEMS = [
  { path: '/manufacturer/dashboard', label: 'Dashboard', icon: HiOutlineSquares2X2 },
  { path: '/manufacturer/products', label: 'Products', icon: HiOutlineCube },
  { path: '/manufacturer/batches', label: 'Batches', icon: HiOutlineArchiveBox },
  { path: '/manufacturer/qr-center', label: 'QR Center', icon: HiOutlineQrCode },
];

export default function ManufacturerLayout() {
  const location = useLocation();
  const { user, organization, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="mfr-spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto 16px', borderTopColor: '#09090b' }} />
          <p style={{ color: '#71717a', fontSize: 13, fontWeight: 600 }}>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <Outlet />;
  }

  if (!user) {
    return <Navigate to="/manufacturer/login" replace />;
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : '?';
  const orgName = organization?.name || 'Organization';
  const orgDomain = organization?.domain || user.email?.split('@')[1] || '';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const pageTitle = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label || 'Portal';

  return (
    <div className="mfr-layout">
      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mfr-sidebar-overlay open"
            onClick={() => setSidebarOpen(false)}
            style={{ display: 'block' }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`mfr-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/manufacturer/dashboard" className="mfr-sidebar-brand" onClick={() => setSidebarOpen(false)}>
          <div className="mfr-sidebar-brand-icon">
            <HiOutlineShieldCheck style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <div className="mfr-sidebar-brand-text">
            <h2>SmartQR</h2>
            <span>Enterprise Portal</span>
          </div>
        </Link>

        <nav className="mfr-sidebar-nav">
          <div className="mfr-sidebar-section">Operations</div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mfr-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                style={{ 
                  position: 'relative', 
                  color: isActive ? '#ffffff' : 'var(--mfr-text-secondary)',
                  fontWeight: isActive ? '600' : '500',
                  background: 'transparent'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--mfr-accent)',
                      borderRadius: 'var(--mfr-radius-md)',
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mfr-sidebar-footer">
          <div className="mfr-sidebar-org">
            <div className="mfr-sidebar-org-name">{orgName}</div>
            <div className="mfr-sidebar-org-domain">{orgDomain}</div>
            <div className="mfr-sidebar-org-badge">
              <HiOutlineShieldCheck style={{ width: 12, height: 12 }} />
              Verified Organization
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="mfr-nav-item" 
            style={{ 
              color: 'var(--mfr-text-muted)',
              fontSize: '13px',
              padding: '10px 14px',
              marginTop: '4px'
            }}
          >
            <HiOutlineArrowRightOnRectangle /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="mfr-main">
        <header className="mfr-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="mfr-mobile-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 8,
                border: '1px solid var(--mfr-border)',
                background: '#ffffff',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {sidebarOpen ? <HiOutlineXMark style={{ width: 18, height: 18 }} /> : <HiOutlineBars3 style={{ width: 18, height: 18 }} />}
            </button>
            <span className="mfr-topbar-title">{pageTitle}</span>
          </div>
          <div className="mfr-topbar-actions">
            <div className="mfr-topbar-user">
              <span className="hide-mobile" style={{ fontSize: '12.5px', color: 'var(--mfr-text-secondary)', fontWeight: 500 }}>{user.email}</span>
              <div className="mfr-topbar-avatar">{userInitial}</div>
            </div>
          </div>
        </header>

        <div className="mfr-content">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>

      {/* Mobile FAB Menu Toggle */}
      <button 
        className="mfr-mobile-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          border: 'none',
          outline: 'none'
        }}
      >
        {sidebarOpen ? <HiOutlineXMark style={{ width: 20, height: 20 }} /> : <HiOutlineBars3 style={{ width: 20, height: 20 }} />}
      </button>
    </div>
  );
}
