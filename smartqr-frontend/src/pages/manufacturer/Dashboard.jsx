import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { getProductByBarcode, addProduct, addBatch, deleteBatch, getAuditLogs } from '../../api/products';
import {
  HiOutlineQrCode, HiOutlinePencilSquare, HiOutlineShieldCheck, HiOutlineClock,
  HiOutlineExclamationTriangle, HiOutlineCamera, HiOutlineDocumentText,
  HiOutlineArchiveBox, HiOutlineExclamationCircle, HiOutlineXMark, HiOutlineCheckBadge
} from 'react-icons/hi2';

const EMPTY_PRODUCT = { barcode: '', product_name: '', manufacturer: '', category: '', instructions: '', warnings: '' };
const EMPTY_BATCH = { batch_id: '', mfg_date: '', exp_date: '' };

const STATUS = {
  SAFE: { label: 'Safe', bg: '#f0fdf4', fg: '#166534', icon: HiOutlineShieldCheck },
  EXPIRING_SOON: { label: 'Expiring', bg: '#fffbeb', fg: '#92400e', icon: HiOutlineClock },
  EXPIRED: { label: 'Expired', bg: '#fef2f2', fg: '#991b1b', icon: HiOutlineExclamationTriangle },
};

const floatingInputStyle = { width: '100%', padding: '24px 16px 8px', background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 15, color: '#1a1a2e', outline: 'none', transition: 'border-color 0.2s, background 0.2s' };

const FloatingDateInput = ({ label, value, onChange, required, error, onBlur }) => (
  <div style={{ position: 'relative', marginBottom: 16 }}>
    <input type="date" value={value} onChange={onChange} onBlur={onBlur} required={required}
      style={{ ...floatingInputStyle, borderColor: error ? '#f87171' : '#e2e8f0', background: 'white' }} 
      className="floating-date-input" />
    <label style={{ position: 'absolute', left: 16, top: 8, fontSize: 11, color: '#718096', pointerEvents: 'none', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label} {required && <span style={{ color: '#f87171' }}>*</span>}
    </label>
    <style>{`
      .floating-date-input:focus { border-color: #2d6a4f !important; }
      .floating-date-input::-webkit-datetime-edit { color: ${value ? 'inherit' : 'transparent'}; }
      .floating-date-input:focus::-webkit-datetime-edit { color: inherit; }
      .floating-date-input::-webkit-calendar-picker-indicator { cursor: pointer; z-index: 10; position: relative; opacity: 1; padding: 10px; }
    `}</style>
  </div>
);

const FloatingInput = ({ label, value, onChange, placeholder, required, type = "text", error, onBlur }) => (
  <div style={{ position: 'relative', marginBottom: 16 }}>
    <input type={type} value={value} onChange={onChange} onBlur={onBlur} placeholder=" " required={required}
      style={{ ...floatingInputStyle, borderColor: error ? '#f87171' : '#e2e8f0', background: value ? 'white' : '#f8f9fa' }} 
      className="floating-input" />
    <label style={{ position: 'absolute', left: 16, top: value ? 8 : 16, fontSize: value ? 11 : 15, color: value ? '#718096' : '#a0aec0', pointerEvents: 'none', transition: 'all 0.2s ease-out', fontWeight: value ? 700 : 500, textTransform: value ? 'uppercase' : 'none', letterSpacing: value ? '0.05em' : 'normal' }}>
      {label} {required && <span style={{ color: '#f87171' }}>*</span>}
    </label>
    <style>{`
      .floating-input:focus { background: white !important; border-color: #2d6a4f !important; }
      .floating-input:focus + label { top: 8px !important; font-size: 11px !important; color: #2d6a4f !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; }
    `}</style>
  </div>
);

const TabButton = ({ id, label, icon: Icon, activeTab, onClick }) => (
  <button onClick={onClick}
    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === id ? '#1a1a2e' : '#a0aec0', fontWeight: 600, fontSize: 15, transition: 'color 0.2s' }}>
    <Icon style={{ width: 20, height: 20 }} /> {label}
    {activeTab === id && (
      <motion.div layoutId="activeDashboardTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#1a1a2e', borderRadius: '3px 3px 0 0' }} />
    )}
  </button>
);

// Hook for persistent local storage (Draft Mode)
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('SCAN'); // 'SCAN' or 'MANUAL'
  const [recentProducts, setRecentProducts] = useLocalStorage('smartqr_recent_products', []);
  const [draftProduct, setDraftProduct] = useLocalStorage('smartqr_draft_product', EMPTY_PRODUCT);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [activeProduct, setActiveProduct] = useState(null);
  const [activeBatches, setActiveBatches] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [scanning, setScanning] = useState(false);
  const html5QrRef = useRef(null);
  
  const [ocrMode, setOcrMode] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrRawText, setOcrRawText] = useState("");
  const [ocrCameras, setOcrCameras] = useState([]);
  const [ocrSelectedCamera, setOcrSelectedCamera] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ocrStreamRef = useRef(null);

  const showMsg = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage(null), 4000); };

  // --- RECENT PRODUCTS LOGIC ---
  const addToRecent = (product) => {
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.barcode !== product.barcode);
      return [product, ...filtered].slice(0, 5); // Keep last 5
    });
  };

  const loadRecentProduct = async (barcode) => {
    await handleLookupBarcode(barcode);
  };

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await getAuditLogs();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // --- SCANNER LOGIC ---
  const startScanner = async () => {
    // Wait for previous tab's exit animation to finish and element to mount
    for (let i = 0; i < 20; i++) {
      if (document.getElementById('dashboard-qr-reader')) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (!document.getElementById('dashboard-qr-reader')) {
      console.error("Scanner element not found in DOM");
      showMsg('Failed to load camera interface. Please try again.', 'error');
      return;
    }

    setScanning(true);
    const qrConfig = { fps: 30, qrbox: { width: 300, height: 300 } };
    
    const onSuccess = async (decodedText) => {
      stopScanner();
      await handleLookupBarcode(decodedText);
    };

    try {
      // Force permission prompt to bypass browser silent blocking
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(track => track.stop());

      const html5Qr = new Html5Qrcode('dashboard-qr-reader');
      html5QrRef.current = html5Qr;
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        let selectedCameraId = devices[0].id;
        if (devices.length > 1) {
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment')
          );
          selectedCameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;
        }
        await html5Qr.start(selectedCameraId, qrConfig, onSuccess, () => {});
      } else {
        throw new Error("No cameras found");
      }
    } catch (err) {
      setScanning(false);
      showMsg('Camera not available. Seamlessly switching to Manual Entry.', 'error');
      setActiveTab('MANUAL'); // Philosophy: Never punish for failure
    }
  };

  const stopScanner = () => {
    if (html5QrRef.current) {
      try { html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (activeTab === 'SCAN' && !activeProduct) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [activeTab, activeProduct]);

  // --- CORE LOOKUP LOGIC ---
  const handleLookupBarcode = async (barcode) => {
    setLoading(true);
    try {
      const data = await getProductByBarcode(barcode);
      setActiveProduct(data.product);
      setActiveBatches(data.batches || []);
      addToRecent(data.product);
      setShowBatchForm(true); // Jump straight to Add Batch (Quick Add Flow)
      showMsg('Product found! Add a new batch.', 'success');
    } catch (err) {
      if (err.message.includes('not found')) {
        // Intelligent Routing: Product not found, switch to manual with pre-filled barcode
        setActiveProduct(null);
        setDraftProduct(prev => ({ ...prev, barcode: barcode }));
        setActiveTab('MANUAL');
        showMsg(`Barcode ${barcode} is new. Let's create it.`, 'success');
      } else {
        showMsg(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (draftProduct.barcode) handleLookupBarcode(draftProduct.barcode);
  };

  // --- FORM SUBMISSIONS ---
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addProduct(draftProduct);
      showMsg('Product saved successfully! Now add batches.');
      setDraftProduct(EMPTY_PRODUCT); // Clear draft
      await handleLookupBarcode(draftProduct.barcode);
      fetchAuditLogs();
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateBatch = (batchId) => {
    if (activeBatches.some(b => b.batch_id.toLowerCase() === batchId.toLowerCase())) {
      setDuplicateWarning('Possible duplicate batch detected. Proceed with caution.');
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addBatch({ ...batchForm, barcode: activeProduct.barcode });
      showMsg('Batch added successfully!');
      setBatchForm(EMPTY_BATCH);
      setShowBatchForm(false);
      setDuplicateWarning(null);
      // Refresh batches
      const data = await getProductByBarcode(activeProduct.barcode);
      setActiveBatches(data.batches || []);
      fetchAuditLogs();
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    try {
      await deleteBatch(activeProduct.barcode, batchId);
      setActiveBatches(prev => prev.filter(b => b.batch_id !== batchId));
      showMsg('Batch deleted.');
      fetchAuditLogs();
    } catch (err) { showMsg(err.message, 'error'); }
  };

  // --- OCR FLOW (useEffect-driven for reliable video attachment) ---
  useEffect(() => {
    if (!ocrMode) return;
    
    let cancelled = false;
    let stream = null;
    
    const initCamera = async () => {
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        let videoInputs = devices.filter(d => d.kind === 'videoinput');
        
        // If labels are empty, we need to trigger permissions first
        if (videoInputs.length > 0 && !videoInputs[0].label) {
           let tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
           tempStream.getTracks().forEach(t => t.stop());
           devices = await navigator.mediaDevices.enumerateDevices();
           videoInputs = devices.filter(d => d.kind === 'videoinput');
        }
        
        const sorted = [...videoInputs].sort((a, b) => {
          const aName = a.label.toLowerCase();
          const bName = b.label.toLowerCase();
          const isAVirtual = aName.includes('virtual') || aName.includes('obs') || aName.includes('phone') || aName.includes('oneplus') || aName.includes('samsung') || aName.includes('pixel');
          const isBVirtual = bName.includes('virtual') || bName.includes('obs') || bName.includes('phone') || bName.includes('oneplus') || bName.includes('samsung') || bName.includes('pixel');
          if (isAVirtual && !isBVirtual) return 1;
          if (!isAVirtual && isBVirtual) return -1;
          const isAWebcam = aName.includes('integrated') || aName.includes('usb') || aName.includes('facetime') || aName.includes('webcam') || aName.includes('hd camera');
          const isBWebcam = bName.includes('integrated') || bName.includes('usb') || bName.includes('facetime') || bName.includes('webcam') || bName.includes('hd camera');
          if (isAWebcam && !isBWebcam) return -1;
          if (!isAWebcam && isBWebcam) return 1;
          return 0;
        });

        const bestDeviceId = sorted[0]?.deviceId;

        if (bestDeviceId) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: bestDeviceId } } });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (cancelled) { stream?.getTracks().forEach(t => t.stop()); return; }
        
        ocrStreamRef.current = stream;
        
        // Wait for video element to be ready
        const waitForVideo = () => new Promise((resolve) => {
          const check = () => {
            if (videoRef.current) return resolve(videoRef.current);
            requestAnimationFrame(check);
          };
          check();
        });
        
        const videoEl = await waitForVideo();
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        
        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.playsInline = true;
        try { await videoEl.play(); } catch {}
        setOcrLoading(false);
      } catch (err) {
        console.error('OCR Camera Error:', err);
        if (!cancelled) {
          showMsg("Camera unavailable for OCR. Please enter dates manually.", "error");
          setOcrMode(false);
          setOcrLoading(false);
        }
      }
    };
    
    initCamera();
    
    return () => {
      cancelled = true;
      if (stream) { stream.getTracks().forEach(t => t.stop()); }
    };
  }, [ocrMode]);

  const startOcrCamera = () => {
    if (ocrStreamRef.current) {
      ocrStreamRef.current.getTracks().forEach(t => t.stop());
      ocrStreamRef.current = null;
    }
    setOcrLoading(true);
    setOcrMode(true);
  };

  const stopOcrCamera = () => {
    if (ocrStreamRef.current) {
      ocrStreamRef.current.getTracks().forEach(track => track.stop());
      ocrStreamRef.current = null;
    }
    setOcrMode(false);
    setOcrLoading(false);
  };

  const captureOcr = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setOcrProcessing(true);
    setOcrRawText("");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      
      const endpoint = "https://smartqr-vision.cognitiveservices.azure.com/vision/v3.2/read/analyze";
      const key = import.meta.env.VITE_AZURE_VISION_KEY || "";
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/octet-stream'
        },
        body: blob
      });

      if (!response.ok) {
        let errorText = response.statusText;
        try { const errJson = await response.json(); errorText = JSON.stringify(errJson); } catch(e) {}
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const operationLocation = response.headers.get('Operation-Location') || response.headers.get('operation-location');
      if (!operationLocation) throw new Error("No operation-location header found in Azure response.");

      let status = "running";
      let data;
      while (status === "running" || status === "NotStarted") {
        await new Promise(r => setTimeout(r, 1000));
        const res = await fetch(operationLocation, {
          headers: { 'Ocp-Apim-Subscription-Key': key }
        });
        data = await res.json();
        status = data.status;
      }

      if (status === "succeeded") {
        const lines = data.analyzeResult.readResults[0].lines.map(l => l.text);
        setOcrRawText(lines.join("\\n"));

        // Date extraction regex: catches DD/MM/YYYY, MM/YYYY, DD-MM-YYYY, MM-YYYY, MMM YYYY
        const dateRegex = /\\b(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}|\\d{1,2}[\\/\\-]\\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s*\\d{2,4})\\b/gi;
        
        let foundDates = [];
        lines.forEach(line => {
          const matches = line.match(dateRegex);
          if (matches) foundDates.push(...matches);
        });

        const parsedDates = foundDates.map(dStr => {
          let str = dStr.replace(/\\-/g, '/');
          if (str.split('/').length === 2) {
             str = '01/' + str; // assume 1st of month for MM/YYYY format
          }
          let dateObj = new Date(str);
          
          // if invalid, try parsing as DD/MM/YYYY by swapping
          if (isNaN(dateObj)) {
            const parts = str.split('/');
            if (parts.length === 3) {
              let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              dateObj = new Date(`${year}-${parts[1]}-${parts[0]}`); // YYYY-MM-DD
            }
          }
          
          return { original: dStr, date: dateObj, timestamp: dateObj.getTime() };
        }).filter(d => !isNaN(d.timestamp));

        parsedDates.sort((a, b) => a.timestamp - b.timestamp);

        if (parsedDates.length >= 2) {
           const mfg = parsedDates[0].date;
           const exp = parsedDates[parsedDates.length - 1].date;
           setBatchForm(prev => ({
             ...prev,
             mfg_date: mfg.toISOString().split('T')[0],
             exp_date: exp.toISOString().split('T')[0]
           }));
           showMsg("Dates auto-filled from camera! Please verify.");
        } else if (parsedDates.length === 1) {
           const exp = parsedDates[0].date;
           setBatchForm(prev => ({
             ...prev,
             exp_date: exp.toISOString().split('T')[0]
           }));
           showMsg("Found one date, assigned to Expiry. Please verify.");
        } else {
           showMsg("Could not find clear dates in the image. Please enter manually.", "error");
        }
      } else {
        throw new Error("Azure OCR processing failed");
      }
    } catch (err) {
      console.error("OCR Error:", err);
      showMsg(`OCR Error: ${err.message}`, "error");
    } finally {
      setOcrProcessing(false);
    }
  };

  // --- UI COMPONENTS (Internal helpers) ---
  // (FloatingInput and TabButton moved to top level to prevent focus loss)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
        
        {/* MAIN OPERATIONS COLUMN */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>Product Operations</h1>
              <p style={{ marginTop: 4, fontSize: 14, color: '#64748b' }}>Manage product intelligence, verify batches, and monitor expiry data.</p>
            </div>
            
            {!activeProduct && (
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                <TabButton id="MANUAL" label="Data Entry" icon={HiOutlinePencilSquare} activeTab={activeTab} onClick={() => { setActiveTab('MANUAL'); setActiveProduct(null); }} />
                <TabButton id="SCAN" label="Barcode OCR" icon={HiOutlineQrCode} activeTab={activeTab} onClick={() => { setActiveTab('SCAN'); setActiveProduct(null); }} />
              </div>
            )}
          </div>

          {/* Toast */}
          <AnimatePresence>{message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: message.type === 'success' ? '#0f172a' : '#fef2f2', color: message.type === 'success' ? 'white' : '#991b1b', display: 'flex', alignItems: 'center', gap: 10, border: message.type === 'success' ? 'none' : '1px solid #fecaca' }}>
              {message.type === 'success' ? <HiOutlineCheckBadge style={{ width: 18, height: 18, color: '#38bdf8' }} /> : <HiOutlineExclamationTriangle style={{ width: 18, height: 18 }} />}
              {message.text}
            </motion.div>
          )}</AnimatePresence>

          {/* SCENARIO 1: ACTIVE PRODUCT FOUND */}
          <AnimatePresence mode="wait">
            {activeProduct && (
              <motion.div key="active_product" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <button onClick={() => setActiveProduct(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>← Return to Search</button>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #bae6fd' }}>Verified Enterprise Profile</span>
                </div>

                <div style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid #e2e8f0', marginBottom: 32 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{activeProduct.product_name}</h2>
                  <div style={{ display: 'flex', gap: 24, marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Manufacturer</span>
                      <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{activeProduct.manufacturer}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</span>
                      <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{activeProduct.category}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Master Barcode</span>
                      <span style={{ fontSize: 14, color: '#334155', fontWeight: 500, fontFamily: 'monospace' }}>{activeProduct.barcode}</span>
                    </div>
                  </div>
                </div>

                {/* BATCH REGISTRATION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Batch Database</h3>
                  {!showBatchForm && (
                    <button onClick={() => setShowBatchForm(true)} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      + Register Batch
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showBatchForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 32 }}>
                      <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24, border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>New Batch Entry</h4>
                          <button onClick={() => setShowBatchForm(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><HiOutlineXMark style={{ width: 20, height: 20 }} /></button>
                        </div>
                        
                        {/* Duplicate Warning */}
                        <AnimatePresence>{duplicateWarning && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: 20, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, color: '#92400e', fontSize: 13, fontWeight: 500 }}>
                            <HiOutlineExclamationTriangle style={{ width: 18, height: 18 }} /> {duplicateWarning}
                          </motion.div>
                        )}</AnimatePresence>

                        {/* OCR Verification Box */}
                        <AnimatePresence>{ocrRawText && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20, padding: 16, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#475569', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>OCR Extraction Log:</div>
                            {ocrRawText}
                          </motion.div>
                        )}</AnimatePresence>

                        <form onSubmit={handleSaveBatch}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <FloatingInput label="Batch ID (Immutable)" value={batchForm.batch_id} onChange={e => { setBatchForm(prev => ({ ...prev, batch_id: e.target.value })); checkDuplicateBatch(e.target.value); }} required />
                            <FloatingDateInput label="Manufacturing Date" value={batchForm.mfg_date} onChange={e => setBatchForm(prev => ({ ...prev, mfg_date: e.target.value }))} required />
                          </div>
                          
                          <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ flex: 1 }}>
                              <FloatingDateInput label="Expiry Date" value={batchForm.exp_date} onChange={e => setBatchForm(prev => ({ ...prev, exp_date: e.target.value }))} required />
                            </div>
                            <button type="button" onClick={() => { if (!ocrMode) startOcrCamera(); else stopOcrCamera(); }} style={{ padding: '0 20px', height: 56, background: ocrMode ? '#0f172a' : 'white', color: ocrMode ? 'white' : '#0f172a', borderRadius: 12, border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, transition: 'all 0.2s' }}>
                              <HiOutlineCamera style={{ width: 18, height: 18 }} /> {ocrMode ? 'Cancel OCR' : 'AI Expiry OCR'}
                            </button>
                          </div>

                          {/* OCR Assist Panel */}
                          <AnimatePresence>
                            {ocrMode && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                <div style={{ marginTop: 16, padding: 24, background: '#0f172a', borderRadius: 12, color: 'white', border: '1px solid #334155' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <HiOutlineCamera /> Azure Computer Vision Initialization
                                    </h4>
                                    {ocrLoading && <span style={{ fontSize: 12, color: '#94a3b8' }}>Establishing secure connection...</span>}
                                  </div>
                                  
                                  {ocrCameras.length > 1 && (
                                    <select value={ocrSelectedCamera} onChange={handleOcrCameraChange} style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', fontSize: 12, color: 'white', outline: 'none', width: '100%' }}>
                                      {ocrCameras.map(cam => (
                                        <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${cam.deviceId.slice(0,8)}`}</option>
                                      ))}
                                    </select>
                                  )}
                                  
                                  <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155', marginBottom: 16 }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', opacity: ocrLoading ? 0 : 1 }} />
                                    {ocrLoading && <div style={{ position: 'absolute', inset: 0, animation: 'pulse 2s infinite', background: '#1e293b' }} />}
                                  </div>
                                  
                                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                                  
                                  <button type="button" onClick={captureOcr} disabled={ocrProcessing || ocrLoading} style={{ width: '100%', padding: '12px', background: '#0ea5e9', color: 'white', borderRadius: 6, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                                    {ocrProcessing ? 'Processing Image Data...' : 'Capture & Extract'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button type="submit" disabled={loading || ocrProcessing} style={{ marginTop: 20, width: '100%', padding: '14px', background: '#0f172a', color: 'white', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                            {loading ? 'Committing...' : ocrProcessing ? 'Waiting for OCR...' : 'Commit Batch to Ledger'}
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Data Grid: Batches */}
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Batch ID</th>
                        <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Mfg Date</th>
                        <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Expiry Date</th>
                        <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Integrity Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBatches.map(b => {
                        const st = STATUS[b.status];
                        return (
                          <tr key={b.batch_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{b.batch_id}</td>
                            <td style={{ padding: '16px 24px', fontSize: 14, color: '#475569' }}>{b.mfg_date}</td>
                            <td style={{ padding: '16px 24px', fontSize: 14, color: '#475569' }}>{b.exp_date}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4, background: st?.bg, color: st?.fg, border: `1px solid ${st?.fg}30` }}>{st?.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {activeBatches.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No batches registered in the database for this product.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* SCENARIO 2: DATA ENTRY TAB */}
            {!activeProduct && activeTab === 'MANUAL' && (
              <motion.div key="manual_tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                  <div style={{ flex: 1 }}>
                    <FloatingInput label="Enter Product Barcode ID" value={draftProduct.barcode} onChange={e => setDraftProduct(prev => ({ ...prev, barcode: e.target.value }))} required />
                  </div>
                  <button type="submit" disabled={loading} style={{ padding: '0 24px', height: 56, background: '#0f172a', color: 'white', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13 }}>Search Database</button>
                </form>

                <div style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>New Product Registration</h3>
                  
                  <form onSubmit={handleSaveProduct}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <FloatingInput label="Product Name" value={draftProduct.product_name} onChange={e => setDraftProduct(prev => ({ ...prev, product_name: e.target.value }))} required />
                      <FloatingInput label="Organization / Manufacturer" value={draftProduct.manufacturer} onChange={e => setDraftProduct(prev => ({ ...prev, manufacturer: e.target.value }))} required />
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <FloatingInput label="Category" value={draftProduct.category} onChange={e => setDraftProduct(prev => ({ ...prev, category: e.target.value }))} required />
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12, textTransform: 'uppercase' }}>Consumer Information (Optional)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <textarea value={draftProduct.instructions} onChange={e => setDraftProduct(prev => ({ ...prev, instructions: e.target.value }))} placeholder="Instructions for use" rows={3} style={{ ...floatingInputStyle, resize: 'none' }} />
                        <textarea value={draftProduct.warnings} onChange={e => setDraftProduct(prev => ({ ...prev, warnings: e.target.value }))} placeholder="Warnings or contraindications" rows={3} style={{ ...floatingInputStyle, resize: 'none' }} />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} style={{ marginTop: 24, width: '100%', padding: '14px', background: '#0f172a', color: 'white', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                      {loading ? 'Writing to Database...' : 'Register Product Profile'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* SCENARIO 3: OCR BARCODE TAB */}
            {!activeProduct && activeTab === 'SCAN' && (
              <motion.div key="scan_tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, background: '#0f172a', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                    <div id="dashboard-qr-reader" style={{ width: '100%', border: 'none', display: scanning ? 'block' : 'none' }}></div>
                    {scanning ? (
                      <motion.div animate={{ y: [0, 240, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }} style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 2, background: '#38bdf8', boxShadow: '0 0 12px 2px rgba(56,189,248,0.5)', zIndex: 10, pointerEvents: 'none' }} />
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: 13 }}>Initializing Optical Scanner...</p>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: '#475569', marginTop: 24, fontWeight: 500 }}>Scan a physical barcode to access its database profile.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR: AUDIT HISTORY & RECENT */}
        <div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', position: 'sticky', top: 32, overflow: 'hidden' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <HiOutlineDocumentText style={{ color: '#64748b', width: 18, height: 18 }} /> Immutable Audit Log
              </h3>
            </div>
            
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Suspicious Activity Warning Mock */}
              <div style={{ padding: 12, background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: '0 8px 8px 0', display: 'flex', gap: 12 }}>
                <HiOutlineExclamationCircle style={{ color: '#ef4444', width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>Suspicious Modification Blocked</p>
                  <p style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>Attempted expiry extension on BATCH001 by unverified user rejected.</p>
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>No operational history recorded for current session.</p>
              ) : (
                auditLogs.map((log, idx) => (
                  <div key={log.id} style={{ position: 'relative', paddingLeft: 24 }}>
                    {/* Timeline line */}
                    {idx !== auditLogs.length - 1 && <div style={{ position: 'absolute', left: 4, top: 16, bottom: -16, width: 1, background: '#e2e8f0' }} />}
                    <div style={{ position: 'absolute', left: 0, top: 4, width: 9, height: 9, borderRadius: '50%', background: '#38bdf8', border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0' }} />
                    
                    <div style={{ display: 'block', width: '100%', textAlign: 'left', padding: 12, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{log.action}</span>
                        <span style={{ fontSize: 10, color: '#cbd5e1' }}>{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
               <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                 <HiOutlineShieldCheck /> All actions securely logged
               </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
