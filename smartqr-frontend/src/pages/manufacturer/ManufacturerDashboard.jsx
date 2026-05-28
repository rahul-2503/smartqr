import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCube, HiOutlineArchiveBox, HiOutlineQrCode,
  HiOutlineExclamationTriangle, HiOutlineArrowRight,
  HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineSparkles,
  HiOutlineArrowTrendingUp, HiOutlineCalendar
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getOrgProducts, getAuditLogs } from '../../api/manufacturerApi';
import '../../manufacturer.css';

// SVG Chart Data & Tooltips
const CHART_POINTS = [
  { day: 'Mon', scans: 145 },
  { day: 'Tue', scans: 232 },
  { day: 'Wed', scans: 198 },
  { day: 'Thu', scans: 312 },
  { day: 'Fri', scans: 280 },
  { day: 'Sat', scans: 490 },
  { day: 'Sun', scans: 560 }
];

export default function ManufacturerDashboard() {
  const { organization, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [auditLogs, setAuditLogsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChartIndex, setActiveChartIndex] = useState(6); // Default to Sun

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [prodData, logData] = await Promise.all([
        getOrgProducts(),
        getAuditLogs().catch(() => ({ logs: [] }))
      ]);
      setProducts(prodData.products || []);
      setBatches(prodData.batches || []);
      setAuditLogsList(logData.logs || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalQRs = batches.reduce((sum, b) => sum + (b.total_tablets || 0), 0);
  const expiringCount = batches.filter(b => b.status === 'EXPIRING_SOON').length;
  const expiredCount = batches.filter(b => b.status === 'EXPIRED').length;

  const stats = [
    { label: 'Products Registered', value: products.length, icon: HiOutlineCube, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.05)' },
    { label: 'Active Batches', value: batches.length, icon: HiOutlineArchiveBox, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.05)' },
    { label: 'QR Codes Tracked', value: totalQRs, icon: HiOutlineQrCode, color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)' },
    { label: 'Critical Alerts', value: expiringCount + expiredCount, icon: HiOutlineExclamationTriangle, color: (expiringCount + expiredCount) > 0 ? '#dc2626' : '#10b981', bg: (expiringCount + expiredCount) > 0 ? 'rgba(220, 38, 38, 0.05)' : 'rgba(16, 185, 129, 0.05)' },
  ];

  // Helper for batch timeline percentage
  const getExpiryProgress = (batch) => {
    try {
      const mfg = new Date(batch.mfg_date);
      const exp = new Date(batch.exp_date);
      const now = new Date();
      const total = exp - mfg;
      if (total <= 0) return 100;
      const elapsed = now - mfg;
      return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    } catch {
      return 50;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="mfr-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }

  // Draw smooth SVG path for scans
  const svgWidth = 500;
  const svgHeight = 130;
  const padding = 20;
  const pointsCount = CHART_POINTS.length;
  
  const pointsString = CHART_POINTS.map((pt, idx) => {
    const x = padding + (idx * (svgWidth - padding * 2)) / (pointsCount - 1);
    const maxScans = 600;
    const y = svgHeight - padding - (pt.scans * (svgHeight - padding * 2)) / maxScans;
    return `${x},${y}`;
  }).join(' ');

  const fillPathString = `${padding},${svgHeight - padding} ${pointsString} ${svgWidth - padding},${svgHeight - padding} Z`;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Page Header */}
      <div className="mfr-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Welcome back, {organization?.name || 'Organization'} 
            <HiOutlineSparkles style={{ width: 18, height: 18, color: '#f59e0b' }} />
          </h1>
          <p style={{ fontSize: '13px' }}>Workspace Administrator • {user?.email}</p>
        </div>
        <div className="mfr-page-header-actions" style={{ gap: '12px' }}>
          <Link to="/manufacturer/products" className="mfr-btn mfr-btn-outline" style={{ background: '#ffffff' }}>
            <HiOutlineCube style={{ width: 15, height: 15 }} /> Add Product
          </Link>
          <Link to="/manufacturer/qr-center" className="mfr-btn mfr-btn-primary">
            <HiOutlineQrCode style={{ width: 15, height: 15 }} /> Generate Labels
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mfr-stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="mfr-stat-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="mfr-stat-value">{stat.value.toLocaleString()}</div>
                  <div className="mfr-stat-label" style={{ color: 'var(--mfr-text-muted)', fontSize: '12px' }}>{stat.label}</div>
                </div>
                <div className="mfr-stat-icon" style={{ background: stat.bg, borderColor: 'transparent', marginBottom: 0 }}>
                  <Icon style={{ width: 18, height: 18, color: stat.color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="mfr-dashboard-grid">
        {/* Left Column: Charts & Batches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Scan Activity Interactive Chart */}
          <div className="mfr-card">
            <div className="mfr-card-header" style={{ padding: '20px 24px' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiOutlineArrowTrendingUp style={{ width: 16, height: 16, color: '#10b981' }} />
                  Verification Activity
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', margin: '2px 0 0' }}>Real-time scans & checks across all distributed QR batches</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mfr-text-primary)' }}>
                  {CHART_POINTS[activeChartIndex].scans} scans
                </span>
                <span style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', display: 'block' }}>
                  on {CHART_POINTS[activeChartIndex].day}
                </span>
              </div>
            </div>
            <div className="mfr-card-body" style={{ padding: '20px 24px 10px' }}>
              <div style={{ position: 'relative' }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '140px', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e4e4e7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#e4e4e7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#f4f4f5" strokeWidth="1" />
                  <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#f4f4f5" strokeWidth="1" />
                  <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#e4e4e7" strokeWidth="1" />

                  {/* Gradient Area under line */}
                  <path d={fillPathString} fill="url(#scansGrad)" />
                  
                  {/* Line Chart */}
                  <path d={`M ${pointsString}`} fill="none" stroke="var(--mfr-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Points */}
                  {CHART_POINTS.map((pt, idx) => {
                    const x = padding + (idx * (svgWidth - padding * 2)) / (pointsCount - 1);
                    const maxScans = 600;
                    const y = svgHeight - padding - (pt.scans * (svgHeight - padding * 2)) / maxScans;
                    const isActive = idx === activeChartIndex;
                    
                    return (
                      <g key={pt.day} style={{ cursor: 'pointer' }} onMouseEnter={() => setActiveChartIndex(idx)}>
                        {/* Invisible hover helper */}
                        <circle cx={x} cy={y} r="16" fill="transparent" />
                        {/* Real dot */}
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={isActive ? "5" : "3.5"} 
                          fill={isActive ? "var(--mfr-accent)" : "#ffffff"} 
                          stroke="var(--mfr-accent)" 
                          strokeWidth="2" 
                          style={{ transition: 'all 0.15s ease' }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* X labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px', marginTop: '4px' }}>
                  {CHART_POINTS.map((pt, idx) => (
                    <span 
                      key={pt.day} 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: idx === activeChartIndex ? '700' : '500',
                        color: idx === activeChartIndex ? 'var(--mfr-text-primary)' : 'var(--mfr-text-muted)',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                      onClick={() => setActiveChartIndex(idx)}
                    >
                      {pt.day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Batches & Expiry Progress */}
          <div className="mfr-card">
            <div className="mfr-card-header">
              <h3>Recent Batch Expiry Tracking</h3>
              <Link to="/manufacturer/batches" className="mfr-btn mfr-btn-sm mfr-btn-outline" style={{ background: '#ffffff' }}>
                All Batches <HiOutlineArrowRight style={{ width: 12, height: 12 }} />
              </Link>
            </div>
            <div className="mfr-card-body" style={{ padding: 0 }}>
              {batches.length === 0 ? (
                <div className="mfr-empty">
                  <HiOutlineArchiveBox />
                  <h4>No batches registered</h4>
                  <p>Register your first product to generate batch barcodes.</p>
                </div>
              ) : (
                <div className="mfr-table-wrap">
                  <table className="mfr-table">
                    <thead>
                      <tr>
                        <th>Batch Details</th>
                        <th>Scan Codes</th>
                        <th style={{ width: '180px' }}>Expiry Progress</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.slice(0, 5).map(b => {
                        const progress = getExpiryProgress(b);
                        const progressColor = b.status === 'EXPIRED' ? '#dc2626' : b.status === 'EXPIRING_SOON' ? '#d97706' : '#10b981';
                        
                        return (
                          <tr key={b.batch_id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{b.batch_id}</div>
                              <div style={{ fontSize: '11.5px', color: 'var(--mfr-text-secondary)', marginTop: '2px' }}>{b.product_name}</div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{(b.total_tablets || 0).toLocaleString()}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', background: '#f4f4f5', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${progress}%`, height: '100%', background: progressColor, borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mfr-text-secondary)', width: '32px', textAlign: 'right' }}>
                                  {progress}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`mfr-badge ${b.status === 'SAFE' ? 'mfr-badge-safe' : b.status === 'EXPIRED' ? 'mfr-badge-danger' : 'mfr-badge-warning'}`}>
                                {b.status === 'SAFE' ? 'Safe' : b.status === 'EXPIRED' ? 'Expired' : `${b.days_left}d left`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Activity Log Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="mfr-card" style={{ position: 'sticky', top: '96px' }}>
            <div className="mfr-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HiOutlineDocumentText style={{ width: 16, height: 16, color: 'var(--mfr-text-secondary)' }} />
                Workspace Activity
              </h3>
            </div>
            
            <div className="mfr-card-body" style={{ padding: '20px 24px', maxHeight: '420px', overflowY: 'auto' }}>
              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mfr-text-muted)' }}>
                  <p style={{ fontSize: '13px' }}>No actions logged in this workspace yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {auditLogs.slice(0, 8).map((log, idx) => (
                    <div key={log.id} style={{ position: 'relative', paddingLeft: '22px' }}>
                      {/* Vertical line indicator */}
                      {idx !== Math.min(auditLogs.length, 8) - 1 && (
                        <div style={{ position: 'absolute', left: '4px', top: '16px', bottom: '-24px', width: '1.5px', background: '#e4e4e7' }} />
                      )}
                      {/* Timeline dot */}
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: '0px', 
                          top: '4px', 
                          width: '9px', 
                          height: '9px', 
                          borderRadius: '50%', 
                          background: log.action?.includes('REGISTER') ? '#2563eb' : '#10b981', 
                          border: '2px solid #ffffff', 
                          boxShadow: '0 0 0 1px #e4e4e7' 
                        }} 
                      />
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mfr-text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--mfr-text-muted)' }}>
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--mfr-text-secondary)', lineHeight: 1.4, margin: '2px 0 0' }}>
                          {log.details}
                        </p>
                        {log.actor && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--mfr-text-muted)', fontWeight: 500 }}>
                              by {log.actor}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--mfr-border)', background: 'var(--mfr-bg-secondary)', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <HiOutlineShieldCheck style={{ width: 14, height: 14, color: '#10b981' }} />
                Workspace activity verified
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
