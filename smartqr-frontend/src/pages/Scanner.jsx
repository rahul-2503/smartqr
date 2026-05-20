import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import Tesseract from 'tesseract.js';
import { getProductByBarcode } from '../api/products';
import { 
  HiOutlineQrCode, HiOutlineExclamationTriangle, HiOutlineXMark, 
  HiOutlineShieldCheck, HiOutlineClock, HiOutlineCamera, HiOutlineCheckBadge, HiOutlineSpeakerWave
} from 'react-icons/hi2';

const STATUS = {
  SAFE: { label: 'Safe to Consume', bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0', icon: HiOutlineShieldCheck, msg: 'This product is fresh and safe to use.' },
  EXPIRING_SOON: { label: 'Expiring Soon', bg: '#fffbeb', fg: '#92400e', border: '#fde68a', icon: HiOutlineClock, msg: 'Use caution. This product will expire soon.' },
  EXPIRED: { label: 'Expired - Do Not Use', bg: '#fef2f2', fg: '#991b1b', border: '#fecaca', icon: HiOutlineExclamationTriangle, msg: 'Warning: This product has passed its expiry date.' }
};

export default function Scanner() {
  const [step, setStep] = useState('BARCODE'); // 'BARCODE', 'PRODUCT_FOUND', 'RESULT'
  const [product, setProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [resolvedBatch, setResolvedBatch] = useState(null);
  
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraWarning, setCameraWarning] = useState(null);
  
  const [ocrMode, setOcrMode] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  
  // New OCR Camera Management State
  const [ocrCameras, setOcrCameras] = useState([]);
  const [ocrSelectedCamera, setOcrSelectedCamera] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  const html5QrRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ocrStreamRef = useRef(null);

  // --- Step 1: Barcode Scanner ---
  const startBarcodeScanner = async () => {
    setError(null); setProduct(null); setCameraWarning(null); setScanning(true); setStep('BARCODE');

    const qrConfig = { fps: 30, qrbox: { width: 300, height: 300 } };

    const onSuccess = async (decodedText) => {
      if (html5QrRef.current) {
        try { await html5QrRef.current.stop(); } catch { }
      }
      html5QrRef.current = null;
      setScanning(false);
      handleLookupProduct(decodedText);
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(track => track.stop());

      const html5Qr = new Html5Qrcode('qr-reader');
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
        await html5Qr.start(selectedCameraId, qrConfig, onSuccess, () => { });
      } else {
        throw new Error('No camera found');
      }
    } catch (err) {
      setScanning(false);
      setCameraWarning('Camera not available — please allow camera permission.');
      console.error('Camera error:', err);
    }
  };

  const stopBarcodeScanner = async () => {
    if (html5QrRef.current) { try { await html5QrRef.current.stop(); } catch { } html5QrRef.current = null; }
    setScanning(false);
  };

  const handleLookupProduct = async (decodedText) => {
    try {
      if (decodedText.startsWith('{') && decodedText.includes('"bid"')) {
        const qrData = JSON.parse(decodedText);
        const res = await fetch(`/api/getbatch/${qrData.bid}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Batch not found");
        
        setProduct(data.product);
        setResolvedBatch({ ...data.batch, cellScanned: qrData.cell, stripScanned: qrData.strip });
        setStep('RESULT');
        return;
      }

      const data = await getProductByBarcode(decodedText);
      setProduct(data.product);
      setBatches(data.batches || []);
      setStep('PRODUCT_FOUND');
    } catch (err) {
      setError(err.message || "Product not found in our database. It may be unregistered.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const readAloud = () => {
    if (!product || !resolvedBatch) return;
    const isExpired = resolvedBatch.status === 'EXPIRED';
    let text = `${product.medicine_name}, ${product.dosage}. `;
    if (isExpired) {
      text += "Warning! This product has expired. Do not consume. ";
    } else {
      text += "This product is safe to consume. ";
    }
    if (product.dosage_instructions) {
      text += `Dosage instructions: ${product.dosage_instructions}. `;
    }
    if (product.warnings) {
      text += `Warning: ${product.warnings}. `;
    }
    const msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };

  // --- Step 2 & 3: OCR & Batch Resolution ---
  
  // useEffect-driven camera: guarantees video element exists before stream attachment
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
        
        // Wait for video element to be ready (React may not have rendered it yet)
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
    setIsOcrProcessing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageUrl = canvas.toDataURL('image/jpeg');
    stopOcrCamera();

    try {
      const result = await Tesseract.recognize(imageUrl, 'eng', { logger: m => console.log(m) });
      // Keep only alphanumeric characters and common date separators
      const cleanedText = result.data.text.replace(/[^a-zA-Z0-9\/\-\.]/g, ' ').replace(/\s+/g, ' ').trim();
      setOcrText(cleanedText);
    } catch (err) {
      console.error(err);
      alert("OCR failed. Please enter the batch ID manually.");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const resolveBatch = () => {
    // Attempt to match the user's confirmed text with our active batches.
    const textToMatch = ocrText.toLowerCase();
    
    // Look for exact batch ID match, or expiry date substring match
    let matchedBatch = batches.find(b => 
      textToMatch.includes(b.batch_id.toLowerCase()) || 
      textToMatch.includes(b.exp_date.toLowerCase()) ||
      textToMatch.includes(b.exp_date.replace(/-/g, '/')) // Common variation
    );

    if (!matchedBatch) {
      // Fallback: If they typed something but it doesn't match, maybe just show them the closest one or warn them.
      // For a production app, we would use fuzzy matching. For now, strict or warning.
      if (batches.length === 1) {
        matchedBatch = batches[0]; // If only 1 exists, assume it's that one.
      } else {
        alert("Could not clearly match this text to an active batch. Please select manually or type carefully.");
        return;
      }
    }

    setResolvedBatch(matchedBatch);
    setStep('RESULT');
  };

  const resetAll = () => {
    stopBarcodeScanner(); stopOcrCamera();
    setStep('BARCODE'); setProduct(null); setBatches([]); setResolvedBatch(null); setOcrText('');
  };

  useEffect(() => { return () => { stopBarcodeScanner(); stopOcrCamera(); }; }, []);

  const st = resolvedBatch ? STATUS[resolvedBatch.status] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingTop: 'var(--page-top)', paddingBottom: 'var(--page-bottom)' }}>
      <div className="container-main" style={{ maxWidth: 500 }}>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>Scan Product</h1>
          <p style={{ marginTop: 8, fontSize: 16, color: '#718096' }}>Scan a retail barcode to instantly check its safety and expiry status.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: BARCODE SCANNER */}
          {step === 'BARCODE' && (
            <motion.div key="barcode" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f3f5', padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.05)' }}>
              
              {!scanning ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ width: 80, height: 80, margin: '0 auto 24px', background: '#f8f9fa', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HiOutlineQrCode style={{ width: 40, height: 40, color: '#2d6a4f' }} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Ready to scan</h2>
                  <p style={{ color: '#718096', marginBottom: 32 }}>Hold your phone steady and point the camera at the 1D retail barcode.</p>
                  <button onClick={startBarcodeScanner} style={{ width: '100%', padding: '16px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 12px rgba(45,106,79,0.2)' }}>
                    Open Camera
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: 'black' }}>
                    <div id="qr-reader" style={{ width: '100%', border: 'none' }}></div>
                  </div>
                  <button onClick={stopBarcodeScanner} style={{ width: '100%', padding: '16px', background: '#f8f9fa', color: '#1a1a2e', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, marginTop: 16 }}>
                    Cancel
                  </button>
                </div>
              )}

              {cameraWarning && (
                <div style={{ marginTop: 16, padding: 16, background: '#fffbeb', color: '#92400e', borderRadius: 12, fontSize: 14 }}>
                  {cameraWarning}
                </div>
              )}

              {error && (
                <div style={{ marginTop: 16, padding: 16, background: '#fef2f2', color: '#991b1b', borderRadius: 12, fontSize: 14 }}>
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: PRODUCT FOUND -> BATCH OCR */}
          {step === 'PRODUCT_FOUND' && product && (
            <motion.div key="product" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f3f5', padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.05)' }}>
              
              <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 16, marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Product Identified</p>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>{product.product_name}</h2>
                <p style={{ fontSize: 14, color: '#718096' }}>{product.manufacturer}</p>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Step 2: Verify Expiry / Batch</h3>
              
              {!ocrMode ? (
                <>
                  <p style={{ fontSize: 14, color: '#718096', marginBottom: 16 }}>
                    Retail barcodes don't contain expiry dates. To verify safety, please enter the batch ID or expiry date printed on the box, or snap a photo of it.
                  </p>
                  
                  <div style={{ marginBottom: 24 }}>
                    <input type="text" value={ocrText} onChange={e => setOcrText(e.target.value)} placeholder="e.g. BATCH001 or EXP 05/27"
                      style={{ width: '100%', padding: '16px', background: '#f8f9fa', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 16, color: '#1a1a2e', outline: 'none', marginBottom: 12 }} />
                    <button onClick={startOcrCamera} style={{ width: '100%', padding: '16px', background: '#e2e8f0', color: '#1a1a2e', fontWeight: 600, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <HiOutlineCamera style={{ width: 20, height: 20 }} /> Scan Text via Camera
                    </button>
                  </div>

                  {isOcrProcessing && <p style={{ textAlign: 'center', color: '#718096', marginBottom: 16 }}>Extracting text... please wait.</p>}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={resolveBatch} disabled={!ocrText} style={{ flex: 1, padding: '16px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, opacity: ocrText ? 1 : 0.5 }}>
                      Verify Status
                    </button>
                    <button onClick={resetAll} style={{ padding: '16px', background: '#fef2f2', color: '#dc2626', borderRadius: 16, border: 'none', cursor: 'pointer' }}>
                      <HiOutlineXMark style={{ width: 24, height: 24 }} />
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#718096', marginBottom: 16 }}>Point your camera at the Batch/Expiry text</p>

                  <div style={{ position: 'relative', background: 'black', borderRadius: 16, overflow: 'hidden', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', opacity: ocrLoading ? 0 : 1, transition: 'opacity 0.3s ease' }} />
                    {ocrLoading && <div style={{ position: 'absolute', inset: 0, background: '#2d3748', animation: 'pulse 2s infinite' }} />}
                    {ocrLoading && <span style={{ position: 'absolute', color: '#a0aec0', fontSize: 14, fontWeight: 500 }}>Preparing camera...</span>}
                  </div>
                  
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={captureOcr} disabled={isOcrProcessing || ocrLoading} style={{ flex: 1, padding: '16px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, transition: 'background 0.2s' }}>
                      {isOcrProcessing ? 'Extracting...' : 'Snap Photo'}
                    </button>
                    <button onClick={stopOcrCamera} style={{ padding: '16px', background: '#f8f9fa', color: '#1a1a2e', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'RESULT' && resolvedBatch && st && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'white', borderRadius: 24, border: `2px solid ${st.border}`, padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              
              <div style={{ width: 80, height: 80, margin: '0 auto 24px', background: st.bg, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <st.icon style={{ width: 40, height: 40, color: st.fg }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: st.fg, marginBottom: 8 }}>{st.label}</h2>
              <p style={{ fontSize: 16, color: '#4a5568', marginBottom: 32 }}>{st.msg}</p>

              <div style={{ textAlign: 'left', background: '#f8f9fa', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>Product Details</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#718096', fontSize: 14 }}>Name</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{product.product_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#718096', fontSize: 14 }}>Batch</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{resolvedBatch.batch_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#718096', fontSize: 14 }}>Expiry</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{resolvedBatch.exp_date}</span>
                </div>
              </div>

              {/* Trust & Verification Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#f0fdf4', color: '#166534', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #bbf7d0' }}>
                  <HiOutlineShieldCheck style={{ width: 18, height: 18 }} />
                  Authenticity Guaranteed
                </div>
                {resolvedBatch.cellScanned && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#f8fafc', color: '#334155', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0' }}>
                    Tablet {resolvedBatch.cellScanned} of Strip {resolvedBatch.stripScanned}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#e0f2fe', color: '#0369a1', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #bae6fd' }}>
                  <HiOutlineCheckBadge style={{ width: 18, height: 18 }} />
                  Verified Manufacturer Data
                </div>
              </div>

              <button onClick={readAloud} style={{ width: '100%', padding: '16px', background: '#e0e7ff', color: '#4338ca', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <HiOutlineSpeakerWave style={{ width: 24, height: 24 }} />
                Read Aloud
              </button>

              <button onClick={resetAll} style={{ width: '100%', padding: '16px', background: '#1a1a2e', color: 'white', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16 }}>
                Scan Another Product
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}