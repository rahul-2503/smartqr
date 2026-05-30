import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCube, HiOutlineArchiveBox, HiOutlineQrCode,
  HiOutlineExclamationTriangle, HiOutlineArrowRight,
  HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineSparkles,
  HiOutlineArrowTrendingUp, HiOutlineCalendar, HiOutlineMapPin,
  HiOutlineBell, HiOutlineSignal
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import {
  getOrgProducts,
  getAuditLogs,
  getScanAnalytics,
  negotiateSignalR,
  aiDashboardInsights,
  aiRiskAssessment
} from '../../api/manufacturerApi';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Chart from 'chart.js/auto';
import '../../manufacturer.css';

export default function ManufacturerDashboard() {
  const { organization, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [auditLogs, setAuditLogsList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiryTab, setExpiryTab] = useState('30'); // '30' | '60' | '90'
  const [connectionType, setConnectionType] = useState('none'); // 'signalr' | 'polling' | 'none'
  const [toast, setToast] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  // Canvas Refs
  const lineCanvasRef = useRef(null);
  const donutCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);

  // Chart Instance Refs
  const lineChartInstance = useRef(null);
  const donutChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [prodData, logData, analyticsData] = await Promise.all([
        getOrgProducts().catch(() => ({ products: [], batches: [] })),
        getAuditLogs().catch(() => ({ logs: [] })),
        getScanAnalytics().catch((err) => {
          console.error('Scan analytics failed to load:', err);
          return null;
        })
      ]);
      setProducts(prodData.products || []);
      setBatches(prodData.batches || []);
      setAuditLogsList(logData.logs || []);
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAiInsights = async () => {
    setAiInsightsLoading(true);
    try {
      const data = await aiDashboardInsights();
      if (data.insights) setAiInsights(data.insights);
    } catch (err) {
      console.error('AI insights failed:', err);
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const loadRiskAssessment = async () => {
    setRiskLoading(true);
    setShowRiskModal(true);
    try {
      const data = await aiRiskAssessment();
      if (data.assessment) setRiskData(data);
    } catch (err) {
      console.error('AI risk assessment failed:', err);
    } finally {
      setRiskLoading(false);
    }
  };

  // SignalR & Polling integration
  useEffect(() => {
    if (loading) return;

    let connection = null;
    let pollInterval = null;

    const showNotification = (scan) => {
      setToast(scan);
      setTimeout(() => {
        setToast(null);
      }, 4000);
    };

    const setupRealtime = async () => {
      try {
        const connInfo = await negotiateSignalR();
        if (connInfo && connInfo.url && connInfo.accessToken) {
          connection = new HubConnectionBuilder()
            .withUrl(connInfo.url, {
              accessTokenFactory: () => connInfo.accessToken
            })
            .withAutomaticReconnect()
            .build();

          connection.on('newScan', (newScanEvent) => {
            if (newScanEvent.organizationDomain !== organization?.domain) {
              return;
            }
            console.log('Real-time scan received:', newScanEvent);
            showNotification(newScanEvent);

            setAnalytics((prev) => {
              if (!prev) return prev;

              // Update total scans
              const totalScans = prev.totalScans + 1;

              // Prepend to recentActivity
              const recentActivity = [newScanEvent, ...prev.recentActivity].slice(0, 10);

              // Update daily volume for today
              const todayStr = new Date().toISOString().split('T')[0];
              const dailyScanVolume = prev.dailyScanVolume.map((bucket) => {
                if (bucket.date === todayStr) {
                  return { ...bucket, scans: bucket.scans + 1 };
                }
                return bucket;
              });

              // Update topScannedProducts
              const prodName = newScanEvent.productName || 'Unknown Product';
              let topScannedProducts = [...prev.topScannedProducts];
              const existingProd = topScannedProducts.find((p) => p.name === prodName);
              if (existingProd) {
                existingProd.scans += 1;
              } else {
                topScannedProducts.push({ name: prodName, scans: 1 });
              }
              topScannedProducts.sort((a, b) => b.scans - a.scans);

              // Update geoDistribution
              const locKey = `${newScanEvent.city}, ${newScanEvent.country}`;
              let geoDistribution = [...prev.geoDistribution];
              const existingGeo = geoDistribution.find(
                (g) => `${g.city}, ${g.country}` === locKey
              );
              if (existingGeo) {
                existingGeo.scans += 1;
              } else if (newScanEvent.city && newScanEvent.city !== 'Unknown City') {
                geoDistribution.push({
                  city: newScanEvent.city,
                  country: newScanEvent.country,
                  scans: 1,
                  latitude: newScanEvent.latitude,
                  longitude: newScanEvent.longitude
                });
              }
              geoDistribution.sort((a, b) => b.scans - a.scans);

              return {
                ...prev,
                totalScans,
                recentActivity,
                dailyScanVolume,
                topScannedProducts,
                geoDistribution
              };
            });
          });

          await connection.start();
          setConnectionType('signalr');
        } else {
          throw new Error('SignalR negotiation returned empty response.');
        }
      } catch (err) {
        console.warn('SignalR negotiation failed, falling back to short polling:', err);
        setConnectionType('polling');

        pollInterval = setInterval(async () => {
          try {
            const data = await getScanAnalytics();
            if (data) {
              setAnalytics(data);
            }
          } catch (pollErr) {
            console.error('Polling error:', pollErr);
          }
        }, 5000);
      }
    };

    setupRealtime();

    return () => {
      if (connection) {
        connection.stop().catch((err) => console.error('Error stopping SignalR connection:', err));
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [loading]);

  // Chart Rendering Effect
  useEffect(() => {
    if (!analytics) return;

    // 1. Line Chart: Verification Activity
    if (lineCanvasRef.current) {
      if (lineChartInstance.current) lineChartInstance.current.destroy();

      const labels = analytics.dailyScanVolume.map((d) => d.day);
      const data = analytics.dailyScanVolume.map((d) => d.scans);

      lineChartInstance.current = new Chart(lineCanvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Consumer Verification Scans',
              data,
              borderColor: '#09090b',
              backgroundColor: 'rgba(9, 9, 11, 0.03)',
              borderWidth: 2.5,
              tension: 0.3,
              fill: true,
              pointBackgroundColor: '#09090b',
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              padding: 10,
              displayColors: false,
              backgroundColor: '#09090b',
              titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
              bodyFont: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: { family: 'Plus Jakarta Sans', size: 11 }
              },
              grid: { color: '#f4f4f5' }
            }
          }
        }
      });
    }

    // 2. Donut Chart: Status Breakdown
    if (donutCanvasRef.current) {
      if (donutChartInstance.current) donutChartInstance.current.destroy();

      const { safe, expiring, expired } = analytics.statusBreakdown;

      donutChartInstance.current = new Chart(donutCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Safe', 'Expiring Soon', 'Expired'],
          datasets: [
            {
              data: [safe, expiring, expired],
              backgroundColor: ['#10b981', '#f59e0b', '#dc2626'],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
                padding: 12,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              padding: 10,
              titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
              bodyFont: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 3. Bar Chart: Top Scanned Products
    if (barCanvasRef.current) {
      if (barChartInstance.current) barChartInstance.current.destroy();

      const labels = analytics.topScannedProducts.map((p) => p.name);
      const data = analytics.topScannedProducts.map((p) => p.scans);

      barChartInstance.current = new Chart(barCanvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Scans',
              data,
              backgroundColor: 'rgba(9, 9, 11, 0.85)',
              hoverBackgroundColor: '#09090b',
              borderRadius: 6,
              borderWidth: 0,
              barThickness: 20
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              padding: 10,
              titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
              bodyFont: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: { family: 'Plus Jakarta Sans', size: 11 }
              },
              grid: { color: '#f4f4f5' }
            },
            y: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          }
        }
      });
    }

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (donutChartInstance.current) donutChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [analytics]);

  const totalQRs = batches.reduce((sum, b) => sum + (b.total_tablets || 0), 0);
  const expiringCount = analytics?.statusBreakdown?.expiring ?? batches.filter(b => b.status === 'EXPIRING_SOON').length;
  const expiredCount = analytics?.statusBreakdown?.expired ?? batches.filter(b => b.status === 'EXPIRED').length;

  const stats = [
    {
      label: 'Products Registered',
      value: analytics?.totalProducts ?? products.length,
      icon: HiOutlineCube,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.05)'
    },
    {
      label: 'Active Batches',
      value: analytics?.totalBatches ?? batches.length,
      icon: HiOutlineArchiveBox,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.05)'
    },
    {
      label: 'Total Scans',
      value: analytics?.totalScans ?? 0,
      icon: HiOutlineQrCode,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.05)'
    },
    {
      label: 'Critical Alerts',
      value: expiringCount + expiredCount,
      icon: HiOutlineExclamationTriangle,
      color: expiringCount + expiredCount > 0 ? '#dc2626' : '#10b981',
      bg: expiringCount + expiredCount > 0 ? 'rgba(220, 38, 38, 0.05)' : 'rgba(16, 185, 129, 0.05)'
    }
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

  const getExpiryProgressByDates = (mfgDate, expDate) => {
    try {
      const mfg = new Date(mfgDate);
      const exp = new Date(expDate);
      const now = new Date();
      const total = exp - mfg;
      if (total <= 0) return 100;
      const elapsed = now - mfg;
      return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    } catch {
      return 50;
    }
  };

  const cleanUserAgent = (ua) => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android Mobile';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'Mac PC';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Mobile Device';
  };

  const activeAlerts =
    expiryTab === '30'
      ? analytics?.expiryAlerts?.next30 || []
      : expiryTab === '60'
      ? analytics?.expiryAlerts?.next60 || []
      : analytics?.expiryAlerts?.next90 || []

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="mfr-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Real-time scan toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              background: '#09090b',
              color: '#ffffff',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32
              }}
            >
              <HiOutlineQrCode style={{ color: '#10b981', width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>New Scan Verified!</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                {toast.productName} in {toast.city}, {toast.country}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="mfr-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            Welcome back, {organization?.name || 'Organization'}
            <HiOutlineSparkles style={{ width: 18, height: 18, color: '#f59e0b' }} />
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--mfr-text-muted)' }}>
              Workspace Administrator • {user?.email}
            </p>
            <span style={{ color: '#d4d4d8' }}>•</span>
            {/* Realtime / Polling pill indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {connectionType === 'signalr' ? (
                <>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'inline-block',
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981' }}>Live SignalR</span>
                </>
              ) : connectionType === 'polling' ? (
                <>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'inline-block',
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>Auto-Refresh Active</span>
                </>
              ) : (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#71717a', display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#71717a' }}>Offline Fallback</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mfr-page-header-actions" style={{ gap: '12px' }}>
          <button onClick={loadRiskAssessment} className="mfr-btn mfr-btn-outline" style={{ background: '#ffffff', gap: '6px' }} id="risk-assessment-btn">
            <HiOutlineExclamationTriangle style={{ width: 15, height: 15, color: '#dc2626' }} /> AI Risk Report
          </button>
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
                  <div className="mfr-stat-label" style={{ color: 'var(--mfr-text-muted)', fontSize: '12px' }}>
                    {stat.label}
                  </div>
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
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <HiOutlineArrowTrendingUp style={{ width: 16, height: 16, color: '#09090b' }} />
                  Verification Activity
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', margin: '2px 0 0' }}>
                  Real-time consumer verification scans (last 7 days)
                </p>
              </div>
            </div>
            <div className="mfr-card-body" style={{ padding: '12px 24px 20px' }}>
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas ref={lineCanvasRef} />
              </div>
            </div>
          </div>

          {/* Secondary Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Status Breakdown Donut Chart */}
            <div className="mfr-card">
              <div className="mfr-card-header" style={{ padding: '16px 20px' }}>
                <h3 style={{ fontSize: '14px', margin: 0 }}>Batch Status Breakdown</h3>
              </div>
              <div className="mfr-card-body" style={{ padding: '12px 20px 16px' }}>
                <div style={{ height: '180px', position: 'relative' }}>
                  <canvas ref={donutCanvasRef} />
                </div>
              </div>
            </div>

            {/* Top Scanned Products Bar Chart */}
            <div className="mfr-card">
              <div className="mfr-card-header" style={{ padding: '16px 20px' }}>
                <h3 style={{ fontSize: '14px', margin: 0 }}>Top Verified Products</h3>
              </div>
              <div className="mfr-card-body" style={{ padding: '12px 20px 16px' }}>
                <div style={{ height: '180px', position: 'relative' }}>
                  {analytics && analytics.topScannedProducts.length > 0 ? (
                    <canvas ref={barCanvasRef} />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        fontSize: '12px',
                        color: 'var(--mfr-text-muted)'
                      }}
                    >
                      No scan data available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Batches Expiry Tracking */}
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
                      {batches.slice(0, 5).map((b) => {
                        const progress = getExpiryProgress(b);
                        const progressColor =
                          b.status === 'EXPIRED' ? '#dc2626' : b.status === 'EXPIRING_SOON' ? '#d97706' : '#10b981';

                        return (
                          <tr key={b.batch_id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                                {b.batch_id}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--mfr-text-secondary)', marginTop: '2px' }}>
                                {b.product_name}
                              </div>
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

        {/* Right Column: Expiry Alerts & Real-Time Scan Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI Insights Card */}
          <div className="mfr-card" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.03), rgba(59,130,246,0.02))', border: '1px solid rgba(139,92,246,0.12)' }}>
            <div className="mfr-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '14px' }}>
                  <HiOutlineSparkles style={{ width: 16, height: 16, color: '#7c3aed' }} />
                  AI Intelligence Briefing
                </h3>
                <button
                  onClick={loadAiInsights}
                  disabled={aiInsightsLoading}
                  style={{
                    background: aiInsightsLoading ? '#e4e4e7' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    color: aiInsightsLoading ? '#71717a' : '#fff',
                    border: 'none', borderRadius: '6px', padding: '5px 12px',
                    fontSize: '11px', fontWeight: 700, cursor: aiInsightsLoading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                  id="ai-insights-btn"
                >
                  {aiInsightsLoading ? <><div className="mfr-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#71717a' }} /> Analyzing...</> : <><HiOutlineSparkles style={{ width: 12, height: 12 }} /> Generate</>}
                </button>
              </div>
            </div>
            <div className="mfr-card-body" style={{ padding: '16px 20px' }}>
              {aiInsights ? (
                <div style={{ fontSize: '13px', color: 'var(--mfr-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {aiInsights}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--mfr-text-muted)' }}>
                  <HiOutlineSparkles style={{ width: 24, height: 24, margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '12px', margin: 0 }}>Click "Generate" for an AI-powered analysis of your organization\'s operations</p>
                </div>
              )}
            </div>
          </div>

          {/* Expiry Alerts Card */}
          <div className="mfr-card">
            <div className="mfr-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--mfr-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <HiOutlineBell style={{ width: 16, height: 16, color: '#dc2626' }} />
                  Batch Expiry Alerts
                </h3>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f4f4f5', padding: '4px', borderRadius: '8px', margin: '16px 20px 0' }}>
              {['30', '60', '90'].map((threshold) => (
                <button
                  key={threshold}
                  onClick={() => setExpiryTab(threshold)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: expiryTab === threshold ? '#ffffff' : 'transparent',
                    color: expiryTab === threshold ? '#09090b' : '#71717a',
                    fontWeight: 600,
                    fontSize: '12px',
                    padding: '6px 0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: expiryTab === threshold ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  &lt; {threshold} Days ({expiryTab === threshold ? activeAlerts.length : (
                    threshold === '30' ? (analytics?.expiryAlerts?.next30?.length || 0) :
                    threshold === '60' ? (analytics?.expiryAlerts?.next60?.length || 0) :
                    (analytics?.expiryAlerts?.next90?.length || 0)
                  )})
                </button>
              ))}
            </div>

            <div className="mfr-card-body" style={{ padding: '16px 20px', maxHeight: '250px', overflowY: 'auto' }}>
              {activeAlerts.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', textAlign: 'center' }}>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <HiOutlineShieldCheck style={{ width: 22, height: 22, color: '#10b981' }} />
                  </div>
                  <h4 style={{ fontSize: '13px', margin: 0, fontWeight: 700 }}>All Clear!</h4>
                  <p style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', margin: '4px 0 0' }}>
                    No batches expiring within {expiryTab} days.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.batchId}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(220, 38, 38, 0.02)',
                        border: '1px solid rgba(220, 38, 38, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--mfr-text-primary)' }}>
                          {alert.productName}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--mfr-text-muted)',
                            fontFamily: 'monospace',
                            marginTop: '2px'
                          }}
                        >
                          Batch: {alert.batchId}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--mfr-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <HiOutlineCalendar style={{ width: 12, height: 12 }} />
                          Exp: {new Date(alert.expDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          className={`mfr-badge ${alert.daysLeft <= 15 ? 'mfr-badge-danger' : 'mfr-badge-warning'}`}
                          style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px' }}
                        >
                          {alert.daysLeft} days left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Real-time Scan Activity Feed */}
          <div className="mfr-card">
            <div className="mfr-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <HiOutlineSignal style={{ width: 16, height: 16, color: '#10b981' }} />
                Real-Time Consumer Scans
              </h3>
            </div>
            <div className="mfr-card-body" style={{ padding: '16px 20px', maxHeight: '350px', overflowY: 'auto' }}>
              {!analytics || analytics.recentActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mfr-text-muted)' }}>
                  <p style={{ fontSize: '13px', margin: 0 }}>No scan activity tracked yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analytics.recentActivity.map((scan) => (
                    <div
                      key={scan.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--mfr-border)',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--mfr-bg-tertiary)',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <HiOutlineQrCode style={{ width: 16, height: 16, color: 'var(--mfr-text-secondary)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mfr-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {scan.productName}
                          </span>
                          <span style={{ fontSize: '9.5px', color: 'var(--mfr-text-muted)', flexShrink: 0 }}>
                            {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--mfr-text-secondary)',
                            fontFamily: 'monospace',
                            marginTop: '1px'
                          }}
                        >
                          Batch: {scan.batchId}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '4px',
                            fontSize: '11px',
                            color: 'var(--mfr-text-muted)'
                          }}
                        >
                          <HiOutlineMapPin style={{ width: 12, height: 12, color: '#dc2626' }} />
                          <span>
                            {scan.city}, {scan.region ? `${scan.region}, ` : ''}{scan.country}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--mfr-text-muted)', marginTop: '2px' }}>
                          Device: {cleanUserAgent(scan.userAgent)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workspace Activity Log */}
          <div className="mfr-card">
            <div className="mfr-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <HiOutlineDocumentText style={{ width: 16, height: 16, color: 'var(--mfr-text-secondary)' }} />
                Workspace Activity
              </h3>
            </div>

            <div className="mfr-card-body" style={{ padding: '20px 24px', maxHeight: '350px', overflowY: 'auto' }}>
              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mfr-text-muted)' }}>
                  <p style={{ fontSize: '13px', margin: 0 }}>No actions logged in this workspace yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {auditLogs.slice(0, 5).map((log, idx) => (
                    <div key={log.id} style={{ position: 'relative', paddingLeft: '22px' }}>
                      {/* Vertical line indicator */}
                      {idx !== Math.min(auditLogs.length, 5) - 1 && (
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

            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--mfr-border)',
                background: 'var(--mfr-bg-secondary)',
                textAlign: 'center'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--mfr-text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
              >
                <HiOutlineShieldCheck style={{ width: 14, height: 14, color: '#10b981' }} />
                Workspace activity verified
              </span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
      `}</style>

      {/* Risk Assessment Modal */}
      <AnimatePresence>
        {showRiskModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.4)', backdropFilter: 'blur(12px)', zIndex: 400 }}
              onClick={() => !riskLoading && setShowRiskModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: '#fff', borderRadius: '16px', width: '95%', maxWidth: '720px', maxHeight: '85vh',
                overflowY: 'auto', zIndex: 401, boxShadow: '0 25px 50px rgba(0,0,0,0.15)', border: '1px solid var(--mfr-border)'
              }}
            >
              <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--mfr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineSparkles style={{ width: 20, height: 20, color: '#7c3aed' }} /> AI Risk Assessment
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--mfr-text-muted)' }}>Powered by Azure OpenAI • Real-time org data analysis</p>
                </div>
                <button onClick={() => setShowRiskModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--mfr-text-muted)' }}>
                  <HiOutlineExclamationTriangle style={{ width: 0, height: 0 }} />
                  ✕
                </button>
              </div>
              <div style={{ padding: '24px 28px' }}>
                {riskLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="mfr-spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--mfr-text-muted)', fontWeight: 600 }}>Analyzing {organization?.name || 'organization'} data...</p>
                    <p style={{ fontSize: '11px', color: 'var(--mfr-text-muted)' }}>Products, batches, scans, and audit logs</p>
                  </div>
                ) : riskData?.assessment ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Risk Score Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '12px', background: riskData.assessment.overallRiskLevel === 'CRITICAL' ? 'rgba(220,38,38,0.04)' : riskData.assessment.overallRiskLevel === 'HIGH' ? 'rgba(245,158,11,0.04)' : 'rgba(16,185,129,0.04)', border: '1px solid ' + (riskData.assessment.overallRiskLevel === 'CRITICAL' ? 'rgba(220,38,38,0.15)' : riskData.assessment.overallRiskLevel === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)') }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: riskData.assessment.overallRiskLevel === 'CRITICAL' || riskData.assessment.overallRiskLevel === 'HIGH' ? 'rgba(220,38,38,0.1)' : 'rgba(16,185,129,0.1)', fontSize: '20px', fontWeight: 900, color: riskData.assessment.overallRiskLevel === 'CRITICAL' || riskData.assessment.overallRiskLevel === 'HIGH' ? '#dc2626' : '#10b981' }}>
                        {riskData.assessment.riskScore}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800 }}>{riskData.assessment.overallRiskLevel} Risk</div>
                        <div style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', marginTop: 2 }}>{riskData.assessment.executiveSummary}</div>
                      </div>
                    </div>
                    {/* Critical Alerts */}
                    {riskData.assessment.criticalAlerts?.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--mfr-text-muted)' }}>Alerts ({riskData.assessment.criticalAlerts.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {riskData.assessment.criticalAlerts.map((alert, i) => (
                            <div key={i} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid ' + (alert.severity === 'CRITICAL' ? 'rgba(220,38,38,0.2)' : alert.severity === 'HIGH' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)'), background: alert.severity === 'CRITICAL' ? 'rgba(220,38,38,0.02)' : alert.severity === 'HIGH' ? 'rgba(245,158,11,0.02)' : 'rgba(59,130,246,0.02)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px', background: alert.severity === 'CRITICAL' ? 'rgba(220,38,38,0.1)' : alert.severity === 'HIGH' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: alert.severity === 'CRITICAL' ? '#dc2626' : alert.severity === 'HIGH' ? '#d97706' : '#3b82f6' }}>{alert.severity}</span>
                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--mfr-text-muted)', textTransform: 'uppercase' }}>{alert.category}</span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mfr-text-primary)' }}>{alert.title}</div>
                              <div style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>{alert.description}</div>
                              <div style={{ fontSize: '11.5px', color: '#7c3aed', marginTop: '6px', fontWeight: 600 }}>→ {alert.recommendation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Trends */}
                    {riskData.assessment.trends?.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--mfr-text-muted)' }}>Trends</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {riskData.assessment.trends.map((trend, i) => (
                            <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'var(--mfr-bg-secondary)', border: '1px solid var(--mfr-border)' }}>
                              <div style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', fontWeight: 600 }}>{trend.metric}</div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: trend.direction === 'UP' ? '#10b981' : trend.direction === 'DOWN' ? '#dc2626' : '#71717a', marginTop: 2 }}>
                                {trend.direction === 'UP' ? '↑' : trend.direction === 'DOWN' ? '↓' : '→'} {trend.value}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--mfr-text-secondary)', marginTop: 2 }}>{trend.interpretation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Compliance */}
                    {riskData.assessment.complianceSummary && (
                      <div style={{ padding: '16px', borderRadius: '8px', background: riskData.assessment.complianceSummary.status === 'COMPLIANT' ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.04)', border: '1px solid ' + (riskData.assessment.complianceSummary.status === 'COMPLIANT' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)') }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HiOutlineShieldCheck style={{ width: 14, height: 14, color: riskData.assessment.complianceSummary.status === 'COMPLIANT' ? '#10b981' : '#d97706' }} />
                          Compliance: {riskData.assessment.complianceSummary.status}
                        </div>
                        {riskData.assessment.complianceSummary.issues?.length > 0 && (
                          <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                            {riskData.assessment.complianceSummary.issues.map((issue, i) => (
                              <li key={i} style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', marginBottom: '2px' }}>{issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {/* Footer */}
                    <div style={{ textAlign: 'center', padding: '12px 0 0', borderTop: '1px solid var(--mfr-border)' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--mfr-text-muted)' }}>
                        Generated {new Date(riskData.generatedAt).toLocaleString()} • Analyzed {riskData.dataPoints?.products || 0} products, {riskData.dataPoints?.batches || 0} batches, {riskData.dataPoints?.scans || 0} scans
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--mfr-text-muted)' }}>
                    <p>Failed to generate risk assessment. Please try again.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
