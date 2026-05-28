import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineQrCode, HiOutlineArrowDownTray, HiOutlinePrinter,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineCube,
  HiOutlineInformationCircle, HiOutlineDocumentText
} from 'react-icons/hi2';
import { getOrgProducts } from '../../api/manufacturerApi';
import { useAuth } from '../../context/AuthContext';
import '../../manufacturer.css';

const SMARTQR_BASE_URL = 'https://lemon-bay-056bf6a00.7.azurestaticapps.net';

export default function QRCenter() {
  const { organization } = useAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [currentStrip, setCurrentStrip] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState(null);
  const [zipProgress, setZipProgress] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getOrgProducts();
      setProducts(data.products || []);
      setBatches(data.batches || []);

      // Auto-select from URL params
      const batchParam = searchParams.get('batch');
      const productParam = searchParams.get('product');
      if (productParam) setSelectedProduct(productParam);
      if (batchParam && data.batches) {
        const found = data.batches.find(b => b.batch_id === batchParam);
        if (found) {
          setSelectedBatch(found);
          setSelectedProduct(found.product_id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const productBatches = batches.filter(b => b.product_id === selectedProduct);
  const selectedProductInfo = products.find(p => p.product_id === selectedProduct);

  const getQRUrl = (batch) => {
    // Use the composite document ID (orgDomain_batchId) for precise point-read lookup
    // This avoids cross-partition queries that could return wrong results
    const lookupId = batch.id || `${batch.organizationDomain}_${batch.batch_id}`;
    return `${SMARTQR_BASE_URL}/scan/${encodeURIComponent(lookupId)}`;
  };

  const downloadStripPNG = async (stripNum) => {
    if (!sheetRef.current || !selectedBatch) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `SmartQR_${selectedBatch.batch_id}_Strip_${stripNum}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showMsg(`Strip ${stripNum} PNG generated successfully!`);
    } catch (err) {
      showMsg('PNG render failed: ' + err.message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const downloadAllZip = async () => {
    if (!sheetRef.current || !selectedBatch) return;
    setDownloading(true);
    setZipProgress(1);
    try {
      const zip = new JSZip();
      const totalStrips = Math.min(selectedBatch.total_strips, 20);

      for (let i = 1; i <= totalStrips; i++) {
        setCurrentStrip(i);
        setZipProgress(Math.round((i / totalStrips) * 100));
        // Wait for React re-render
        await new Promise(r => setTimeout(r, 120));
        const canvas = await html2canvas(sheetRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`Strip_${i}.png`, imgData, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `SmartQR_${selectedBatch.batch_id}_AllStrips.zip`;
      link.click();
      showMsg(`ZIP archive containing ${totalStrips} strips downloaded successfully!`);
      setCurrentStrip(1);
    } catch (err) {
      showMsg('ZIP creation failed: ' + err.message, 'error');
    } finally {
      setDownloading(false);
      setZipProgress(0);
    }
  };

  const printSheet = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="mfr-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Page Header */}
      <div className="mfr-page-header">
        <h1>Print & Export Center</h1>
        <p>Customize label specifications, preview print layouts, and download batch QR bundles.</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className={`mfr-alert ${message.type === 'error' ? 'mfr-alert-error' : 'mfr-alert-success'}`}
          >
            {message.type === 'error' ? <HiOutlineExclamationCircle /> : <HiOutlineCheckCircle />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Control Panel */}
      <div className="mfr-card" style={{ marginBottom: '24px' }}>
        <div className="mfr-card-body" style={{ padding: '24px' }}>
          <div className="mfr-form-row">
            <div className="mfr-form-group" style={{ marginBottom: 0 }}>
              <label className="mfr-label">1. Select Product</label>
              <select className="mfr-select" value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setSelectedBatch(null); }}>
                <option value="">— Choose Product Catalog Item —</option>
                {products.map(p => <option key={p.product_id} value={p.product_id}>{p.medicine_name} ({p.dosage})</option>)}
              </select>
            </div>
            <div className="mfr-form-group" style={{ marginBottom: 0 }}>
              <label className="mfr-label">2. Select Target Batch</label>
              <select className="mfr-select" value={selectedBatch?.batch_id || ''} onChange={e => {
                const b = productBatches.find(b => b.batch_id === e.target.value);
                setSelectedBatch(b || null);
                setCurrentStrip(1);
              }}>
                <option value="">— Choose Associated Batch Run —</option>
                {productBatches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_id} (Exp: {b.exp_date})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {!selectedBatch ? (
        <div className="mfr-card">
          <div className="mfr-empty" style={{ padding: '64px' }}>
            <HiOutlineQrCode />
            <h4>Workspace Empty</h4>
            <p>Select an active product and batch above to initialize the QR printing canvas.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metadata summary & Actions */}
          <div className="mfr-card">
            <div className="mfr-card-header" style={{ padding: '24px' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '15px', fontWeight: 700 }}>
                  <HiOutlineCube style={{ width: 16, height: 16, color: 'var(--mfr-text-secondary)' }} />
                  {selectedProductInfo?.medicine_name} • Batch {selectedBatch.batch_id}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', marginTop: '4px' }}>
                  Mfg: {selectedBatch.mfg_date} • Expiry: {selectedBatch.exp_date} • {selectedBatch.tablets_per_strip} cells/strip • {selectedBatch.total_strips} total strips
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }} className="no-print">
                <button 
                  onClick={() => downloadStripPNG(currentStrip)} 
                  disabled={downloading} 
                  className="mfr-btn mfr-btn-outline"
                  style={{ background: '#ffffff' }}
                >
                  <HiOutlineArrowDownTray style={{ width: 15, height: 15 }} /> Download PNG
                </button>
                <button 
                  onClick={downloadAllZip} 
                  disabled={downloading} 
                  className="mfr-btn mfr-btn-outline"
                  style={{ background: '#ffffff' }}
                >
                  {zipProgress > 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="mfr-spinner" style={{ width: 12, height: 12 }} />
                      {zipProgress}%
                    </span>
                  ) : (
                    <>
                      <HiOutlineArrowDownTray style={{ width: 15, height: 15 }} /> Bundle ZIP
                    </>
                  )}
                </button>
                <button onClick={printSheet} className="mfr-btn mfr-btn-primary">
                  <HiOutlinePrinter style={{ width: 15, height: 15 }} /> Print Labels
                </button>
              </div>
            </div>

            <div className="mfr-card-body no-print" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Strip selector navigator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mfr-text-secondary)' }}>Select Strip Sheet:</span>
                <input 
                  type="number" min={1} max={selectedBatch.total_strips} value={currentStrip}
                  onChange={e => setCurrentStrip(Math.max(1, Math.min(selectedBatch.total_strips, parseInt(e.target.value) || 1)))}
                  className="mfr-input" style={{ width: '80px', height: '36px', padding: '6px 12px' }} 
                />
                <span style={{ fontSize: '12.5px', color: 'var(--mfr-text-muted)' }}>of {selectedBatch.total_strips} strips total</span>
              </div>

              {/* Specifications guidelines */}
              <div 
                className="mfr-alert mfr-alert-info" 
                style={{ margin: 0, padding: '12px 16px', background: 'var(--mfr-bg-secondary)', border: '1px solid var(--mfr-border)' }}
              >
                <HiOutlineInformationCircle style={{ width: 18, height: 18, color: 'var(--mfr-text-secondary)', marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', lineHeight: 1.5 }}>
                  <strong>Label print guidelines:</strong> Standard 300 DPI layout. Printable on A4 packaging templates. Cell sizing is optimized at 15mm × 15mm with 5mm surrounding borders. Print at 100% scale in printer configuration page.
                </div>
              </div>
            </div>
          </div>

          {/* QR Code details */}
          <div className="mfr-card no-print">
            <div className="mfr-card-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <HiOutlineQrCode style={{ width: 16, height: 16, color: 'var(--mfr-text-secondary)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mfr-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SmartQR Code Destination URL
                </span>
              </div>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 14px', 
                  background: 'var(--mfr-bg-secondary)', 
                  border: '1px solid var(--mfr-border)', 
                  borderRadius: 'var(--mfr-radius-md)' 
                }}
              >
                <code style={{ fontSize: '12.5px', color: 'var(--mfr-text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {getQRUrl(selectedBatch)}
                </code>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', marginTop: '8px', margin: '8px 0 0' }}>
                Consumers scanning this code with default smartphone lens/cameras will instantly redirect to this secure verified information page.
              </p>
            </div>
          </div>

          {/* A4 Sheet Preview Canvas */}
          <div 
            style={{ 
              overflowX: 'auto', 
              background: '#f4f4f5', 
              padding: '40px 24px', 
              borderRadius: 'var(--mfr-radius-lg)',
              border: '1px solid var(--mfr-border)'
            }}
            className="no-print-bg"
          >
            <div ref={sheetRef} className="mfr-qr-sheet" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {/* Sheet header */}
              <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #e4e4e7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#09090b', margin: 0, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                      SmartQR™ Ledger Label Sheet
                    </h3>
                    <p style={{ fontSize: '11px', color: '#71717a', marginTop: '3px' }}>
                      {organization?.name || 'Organization Workspace'} • {selectedProductInfo?.medicine_name} ({selectedProductInfo?.dosage})
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, letterSpacing: '0.04em' }}>
                      SHEET {currentStrip} OF {selectedBatch.total_strips}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#3f3f46' }}><strong>Batch ID:</strong> <code style={{ fontFamily: 'monospace' }}>{selectedBatch.batch_id}</code></span>
                  <span style={{ fontSize: '11px', color: '#3f3f46' }}><strong>Mfg Date:</strong> {selectedBatch.mfg_date}</span>
                  <span style={{ fontSize: '11px', color: '#3f3f46' }}><strong>Exp Date:</strong> {selectedBatch.exp_date}</span>
                  {selectedBatch.mrp && <span style={{ fontSize: '11px', color: '#3f3f46' }}><strong>MRP:</strong> ₹{selectedBatch.mrp}</span>}
                </div>
              </div>

              {/* QR Grid */}
              <div 
                className="mfr-qr-grid" 
                style={{ 
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '12px'
                }}
              >
                {Array.from({ length: selectedBatch.tablets_per_strip }).map((_, i) => {
                  const cellNum = i + 1;
                  const qrUrl = getQRUrl(selectedBatch);
                  return (
                    <div 
                      key={i} 
                      className="mfr-qr-cell" 
                      style={{ 
                        width: '32mm', 
                        height: '32mm', 
                        border: '1px dashed #d4d4d8', 
                        borderRadius: '8px',
                        background: '#ffffff'
                      }}
                    >
                      <QRCodeSVG
                        value={qrUrl}
                        size={64}
                        level="M"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#09090b"
                      />
                      <span style={{ fontSize: '8px', color: '#71717a', marginTop: '4px', fontFamily: 'monospace', fontWeight: 500 }}>
                        {selectedBatch.batch_id}·{cellNum}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Sheet footer */}
              <div 
                style={{ 
                  marginTop: '32px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid #e4e4e7', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <span style={{ fontSize: '8.5px', color: '#a1a1aa', fontWeight: 500 }}>
                  SmartQR™ Platform • Verify safety by scanning code
                </span>
                <span style={{ fontSize: '8.5px', color: '#a1a1aa', fontFamily: 'monospace' }}>
                  {selectedBatch.batch_id} • Strip {currentStrip} • {new Date().toISOString().split('T')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
