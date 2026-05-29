import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import Tesseract from 'tesseract.js';
import jsQR from 'jsqr';
import { getProductByBarcode } from '../api/products';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineQrCode, HiOutlineExclamationTriangle, HiOutlineXMark, 
  HiOutlineShieldCheck, HiOutlineClock, HiOutlineCamera, HiOutlineCheckBadge, HiOutlineSpeakerWave,
  HiOutlineArrowUpTray
} from 'react-icons/hi2';

function getStatus(t) {
  return {
    SAFE: { label: t('scanner.statusSafe'), bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0', icon: HiOutlineShieldCheck, msg: t('scanner.statusSafeMsg') },
    EXPIRING_SOON: { label: t('scanner.statusExpiring'), bg: '#fffbeb', fg: '#92400e', border: '#fde68a', icon: HiOutlineClock, msg: t('scanner.statusExpiringMsg') },
    EXPIRED: { label: t('scanner.statusExpired'), bg: '#fef2f2', fg: '#991b1b', border: '#fecaca', icon: HiOutlineExclamationTriangle, msg: t('scanner.statusExpiredMsg') },
  };
}

const calculateDaysLeft = (expDateStr) => {
  if (!expDateStr) return 0;
  const expDate = new Date(expDateStr);
  const today = new Date();
  return Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
};

const getStatusForDays = (daysLeft) => {
  if (daysLeft < 0) return 'EXPIRED';
  if (daysLeft <= 90) return 'EXPIRING_SOON';
  return 'SAFE';
};

export default function Scanner() {
  const { t, speechLang, lang } = useLanguage();
  const navigate = useNavigate();
  const STATUS = getStatus(t);
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
  
  // Gallery upload state
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  
  // New OCR Camera Management State
  const [ocrCameras, setOcrCameras] = useState([]);
  const [ocrSelectedCamera, setOcrSelectedCamera] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  const html5QrRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ocrStreamRef = useRef(null);
  const fileInputRef = useRef(null);

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
      setCameraWarning(t('scanner.cameraWarning'));
      console.error('Camera error:', err);
    }
  };

  const stopBarcodeScanner = async () => {
    if (html5QrRef.current) { try { await html5QrRef.current.stop(); } catch { } html5QrRef.current = null; }
    setScanning(false);
  };

  // --- Gallery Upload Handler ---
  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadProcessing(true);
    setError(null);

    // Debug log - shown in error message so user can screenshot for diagnosis
    const debugLog = [];
    const log = (msg) => { debugLog.push(msg); console.log('[Scanner]', msg); };

    log(`File:${(file.size/1024).toFixed(0)}KB,${file.type}`);

    // Helper: load file as Image via createObjectURL (much more memory efficient than readAsDataURL)
    const loadImageObj = (f) => {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => resolve({ img, url });
        img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
        img.src = url;
      });
    };

    // Helper: convert canvas to a JPEG File object
    const canvasToFile = (canvas, filename) => {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], filename, { type: 'image/jpeg' }));
          else reject(new Error('toBlob null'));
        }, 'image/jpeg', 0.85);
      });
    };

    let objectUrl = null;

    try {
      // Load image — try createImageBitmap first (handles EXIF orientation, very memory efficient)
      let img;
      try {
        if (typeof createImageBitmap === 'function') {
          img = await createImageBitmap(file);
          log(`Bmp:${img.width}x${img.height}`);
        } else {
          throw new Error('noBmp');
        }
      } catch (bmpErr) {
        log(`Bmp:${bmpErr.message}`);
        const loaded = await loadImageObj(file);
        img = loaded.img;
        objectUrl = loaded.url;
        log(`Img:${img.width}x${img.height}`);
      }

      if (!img.width || !img.height) {
        throw new Error(`BadDim:${img.width}x${img.height}`);
      }

      let result = null;

      // 1. Try Native BarcodeDetector
      if ('BarcodeDetector' in window) {
        try {
          const bd = new window.BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
          });
          const barcodes = await bd.detect(img);
          if (barcodes && barcodes.length > 0) {
            result = barcodes[0].rawValue;
            log(`BD:${result}`);
          } else {
            log('BD:0');
          }
        } catch (err) {
          log(`BD:${err.message}`);
        }
      } else {
        log('BD:N/A');
      }

      // Store canvases for html5-qrcode fallback
      const scaledCanvases = [];
      const targetDims = [1600, 1200, 800, 600];

      // 2. Try jsQR across multiple scales (QR codes only)
      if (!result) {
        for (const maxDim of targetDims) {
          if (img.width <= maxDim && img.height <= maxDim && maxDim !== targetDims[0]) continue;

          try {
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
              else { w = Math.round((w * maxDim) / h); h = maxDim; }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) { log(`jQ@${maxDim}:noctx`); continue; }
            ctx.drawImage(img, 0, 0, w, h);
            scaledCanvases.push({ canvas, maxDim });

            const imageData = ctx.getImageData(0, 0, w, h);
            const qr = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
            if (qr) { result = qr.data; log(`jQ@${maxDim}:${result}`); break; }
            else { log(`jQ@${maxDim}:-`); }
          } catch (err) {
            log(`jQ@${maxDim}:${err.message}`);
          }
        }
      }

      // 3. Try html5-qrcode (ZXing) - supports QR AND 1D barcodes
      if (!result) {
        // Prepare scan attempts: resized blobs first (mobile-safe), then original
        const scanAttempts = [];
        for (const { canvas, maxDim } of scaledCanvases) {
          try {
            const f2 = await canvasToFile(canvas, `s${maxDim}.jpg`);
            scanAttempts.push({ file: f2, label: `r${maxDim}` });
          } catch (err) { log(`blob@${maxDim}:${err.message}`); }
        }
        scanAttempts.push({ file, label: 'orig' });

        for (const attempt of scanAttempts) {
          let h5 = null;
          try {
            h5 = new Html5Qrcode('qr-reader-hidden');
            result = await h5.scanFile(attempt.file, false);
            log(`h5(${attempt.label}):${result}`);
            try { await h5.clear(); } catch {}
            break;
          } catch (err) {
            log(`h5(${attempt.label}):-`);
            if (h5) { try { await h5.clear(); } catch {} }
          }
        }
      }

      // Cleanup
      if (img.close) img.close();
      if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }

      if (result) {
        handleLookupProduct(result);
      } else {
        throw new Error('All methods failed');
      }
    } catch (err) {
      console.error('Gallery scan failed:', err);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setError(`Scan failed. Debug: ${debugLog.join(' | ')}`);
      setTimeout(() => setError(null), 30000);
    } finally {
      setIsUploadProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLookupProduct = async (decodedText) => {
    try {
      // Check if it's a SmartQR JSON-encoded QR code
      if (decodedText.startsWith('{') && decodedText.includes('"bid"')) {
        let qrData;
        try {
          qrData = JSON.parse(decodedText);
        } catch (parseErr) {
          throw new Error('Invalid QR data format.');
        }
        
        if (qrData.cell && qrData.strip) {
          navigate(`/scan/${qrData.bid}?cell=${qrData.cell}&strip=${qrData.strip}`);
        } else {
          navigate(`/scan/${qrData.bid}`);
        }
        return;
      }

      // Check if it's a SmartQR URL (e.g., https://lemon-bay-xxx.azurestaticapps.net/scan/BATCH123)
      let batchIdFromUrl = null;
      let urlParams = '';
      try {
        const url = new URL(decodedText);
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2 && (pathParts[0] === 'scan' || pathParts[0] === 'product')) {
          batchIdFromUrl = pathParts[1];
          urlParams = url.search;
        }
      } catch {
        // Not a URL, continue with barcode lookup
      }

      if (batchIdFromUrl) {
        navigate(`/scan/${batchIdFromUrl}${urlParams}`);
        return;
      }

      // Standard barcode lookup
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
    const isExpiring = resolvedBatch.status === 'EXPIRING_SOON';
    
    const name = product.medicine_name || product.product_name || resolvedBatch.product_name || '';
    const mfr = resolvedBatch.organizationName || product.organizationName || '';
    
    const st = isExpired
      ? t('productDetail.speechExpired', { days: Math.abs(resolvedBatch.days_left || 0) })
      : isExpiring
        ? t('productDetail.speechExpiring', { days: resolvedBatch.days_left || 0 })
        : t('productDetail.speechSafe', { days: resolvedBatch.days_left || 0 });
        
    let text = t('productDetail.speechIntro', { product: name, manufacturer: mfr });
    text += ' ' + t('productDetail.speechStatus', { status: st });
    
    if (product.dosage_instructions) {
      text += ' ' + t('productDetail.speechInstructions', { instructions: product.dosage_instructions });
    }
    if (product.warnings) {
      text += ' ' + t('productDetail.speechWarnings', { warnings: product.warnings });
    }
    
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = speechLang;
    
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.lang === speechLang);
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith(lang));
      }
      if (!voice) {
        voice = voices.find(v => v.lang.toLowerCase().includes(lang.toLowerCase()));
      }
      if (voice) {
        msg.voice = voice;
      }
    }
    
    msg.rate = 0.9;
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

    navigate(`/scan/${matchedBatch.batch_id}`);
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
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>{t('scanner.title')}</h1>
          <p style={{ marginTop: 8, fontSize: 16, color: '#718096' }}>{t('scanner.subtitle')}</p>
        </motion.div>

        {/* Hidden div for gallery QR scanning */}
        <div 
          id="qr-reader-hidden" 
          style={{ 
            position: 'absolute', 
            top: '-9999px', 
            left: '-9999px', 
            width: '250px', 
            height: '250px', 
            overflow: 'hidden', 
            opacity: 0 
          }}
        ></div>

        {/* Hidden file input for gallery upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleGalleryUpload}
          style={{ display: 'none' }}
          id="gallery-upload-input"
        />

        <AnimatePresence mode="wait">
          {/* STEP 1: BARCODE SCANNER */}
          {step === 'BARCODE' && (
            <motion.div key="barcode" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f3f5', padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.05)' }}>
              
              {!scanning ? (
                <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ width: 80, height: 80, margin: '0 auto 24px', background: '#f0fdf4', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HiOutlineQrCode style={{ width: 40, height: 40, color: '#2d6a4f' }} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{t('scanner.readyTitle')}</h2>
                  <p style={{ color: '#718096', marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
                    {t('scanner.readyDesc')}
                  </p>

                  {/* Single unified action buttons */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <button 
                      onClick={startBarcodeScanner} 
                      disabled={isUploadProcessing}
                      style={{ 
                        flex: 1, padding: '16px', background: '#2d6a4f', color: 'white', fontWeight: 600, 
                        borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 15, 
                        boxShadow: '0 4px 16px rgba(45,106,79,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit'
                      }}
                    >
                      <HiOutlineCamera style={{ width: 20, height: 20 }} />
                      {t('scanner.openCamera')}
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isUploadProcessing}
                      style={{ 
                        flex: 1, padding: '16px', background: '#f0f9ff', color: '#0369a1', fontWeight: 600, 
                        borderRadius: 16, border: '1.5px solid #bae6fd', cursor: 'pointer', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit'
                      }}
                    >
                      <HiOutlineArrowUpTray style={{ width: 20, height: 20 }} />
                      {t('scanner.uploadImage')}
                    </button>
                  </div>

                  {/* Upload processing indicator */}
                  <AnimatePresence>
                    {isUploadProcessing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 8 }}
                      >
                        <div style={{ 
                          padding: '16px', background: '#f0f9ff', borderRadius: 12, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          border: '1px solid #bae6fd'
                        }}>
                          <div style={{ 
                            width: 20, height: 20, border: '2.5px solid #bae6fd', borderTopColor: '#0369a1', 
                            borderRadius: '50%', animation: 'spin 0.8s linear infinite' 
                          }} />
                          <span style={{ fontSize: 14, color: '#0369a1', fontWeight: 500 }}>{t('scanner.scanningImage')}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: 'black' }}>
                    <div id="qr-reader" style={{ width: '100%', border: 'none' }}></div>
                  </div>
                  <button onClick={stopBarcodeScanner} style={{ width: '100%', padding: '16px', background: '#f8f9fa', color: '#1a1a2e', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, marginTop: 16, fontFamily: 'inherit' }}>
                    {t('scanner.cancel')}
                  </button>
                </div>
              )}

              {cameraWarning && (
                <div style={{ marginTop: 16, padding: 16, background: '#fffbeb', color: '#92400e', borderRadius: 12, fontSize: 14 }}>
                  {cameraWarning}
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 16, padding: 16, background: '#fef2f2', color: '#991b1b', borderRadius: 12, fontSize: 14, border: '1px solid #fecaca' }}
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2: PRODUCT FOUND -> BATCH OCR */}
          {step === 'PRODUCT_FOUND' && product && (
            <motion.div key="product" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f3f5', padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.05)' }}>
              
              <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 16, marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t('scanner.productIdentified')}</p>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>{product.product_name}</h2>
                <p style={{ fontSize: 14, color: '#718096' }}>{product.manufacturer}</p>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>{t('scanner.step2Title')}</h3>
              
              {!ocrMode ? (
                <>
                  <p style={{ fontSize: 14, color: '#718096', marginBottom: 16 }}>
                    {t('scanner.step2Desc')}
                  </p>
                  
                  <div style={{ marginBottom: 24 }}>
                    <input type="text" value={ocrText} onChange={e => setOcrText(e.target.value)} placeholder={t('scanner.inputPlaceholder')}
                      style={{ width: '100%', padding: '16px', background: '#f8f9fa', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 16, color: '#1a1a2e', outline: 'none', marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <button onClick={startOcrCamera} style={{ width: '100%', padding: '16px', background: '#e2e8f0', color: '#1a1a2e', fontWeight: 600, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                      <HiOutlineCamera style={{ width: 20, height: 20 }} /> {t('scanner.scanTextCamera')}
                    </button>
                  </div>

                  {isOcrProcessing && <p style={{ textAlign: 'center', color: '#718096', marginBottom: 16 }}>{t('scanner.extractingText')}</p>}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={resolveBatch} disabled={!ocrText} style={{ flex: 1, padding: '16px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, opacity: ocrText ? 1 : 0.5, fontFamily: 'inherit' }}>
                      {t('scanner.verifyStatus')}
                    </button>
                    <button onClick={resetAll} style={{ padding: '16px', background: '#fef2f2', color: '#dc2626', borderRadius: 16, border: 'none', cursor: 'pointer' }}>
                      <HiOutlineXMark style={{ width: 24, height: 24 }} />
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#718096', marginBottom: 16 }}>{t('scanner.pointCamera')}</p>

                  <div style={{ position: 'relative', background: 'black', borderRadius: 16, overflow: 'hidden', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', opacity: ocrLoading ? 0 : 1, transition: 'opacity 0.3s ease' }} />
                    {ocrLoading && <div style={{ position: 'absolute', inset: 0, background: '#2d3748', animation: 'pulse 2s infinite' }} />}
                    {ocrLoading && <span style={{ position: 'absolute', color: '#a0aec0', fontSize: 14, fontWeight: 500 }}>{t('scanner.preparingCamera')}</span>}
                  </div>
                  
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={captureOcr} disabled={isOcrProcessing || ocrLoading} style={{ flex: 1, padding: '16px', background: '#2d6a4f', color: 'white', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, transition: 'background 0.2s', fontFamily: 'inherit' }}>
                      {isOcrProcessing ? t('scanner.extracting') : t('scanner.snapPhoto')}
                    </button>
                    <button onClick={stopOcrCamera} style={{ padding: '16px', background: '#f8f9fa', color: '#1a1a2e', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                      {t('scanner.cancel')}
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
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>{t('scanner.productDetails')}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#718096', fontSize: 14 }}>{t('scanner.name')}</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14, textAlign: 'right' }}>{product?.medicine_name || product?.product_name || resolvedBatch?.product_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#718096', fontSize: 14 }}>{t('scanner.manufacturer')}</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14, textAlign: 'right' }}>{resolvedBatch.organizationName || product?.organizationName || product?.manufacturer || 'Unknown Manufacturer'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#718096', fontSize: 14 }}>{t('scanner.batch')}</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14, textAlign: 'right' }}>{resolvedBatch.batch_id}</span>
                </div>
                {resolvedBatch.mfg_date && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#718096', fontSize: 14 }}>{t('scanner.mfgDate')}</span>
                    <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14, textAlign: 'right' }}>{resolvedBatch.mfg_date}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#718096', fontSize: 14 }}>{t('scanner.expiry')}</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14, textAlign: 'right' }}>{resolvedBatch.exp_date}</span>
                </div>
                {resolvedBatch.days_left !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#718096', fontSize: 14 }}>
                      {resolvedBatch.days_left >= 0 ? t('productDetail.daysRemaining') : t('productDetail.daysSinceExpiry')}
                    </span>
                    <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14, textAlign: 'right' }}>
                      {Math.abs(resolvedBatch.days_left)}
                    </span>
                  </div>
                )}
              </div>

              {/* Trust & Verification Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#f0fdf4', color: '#166534', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #bbf7d0' }}>
                  <HiOutlineShieldCheck style={{ width: 18, height: 18 }} />
                  {t('scanner.authenticity')}
                </div>
                {resolvedBatch.cellScanned && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#f8fafc', color: '#334155', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0' }}>
                    {t('scanner.tablet')} {resolvedBatch.cellScanned} {t('scanner.ofStrip')} {resolvedBatch.stripScanned}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#e0f2fe', color: '#0369a1', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #bae6fd' }}>
                  <HiOutlineCheckBadge style={{ width: 18, height: 18 }} />
                  {t('scanner.verifiedManufacturer')}
                </div>
              </div>

              <button onClick={readAloud} style={{ width: '100%', padding: '16px', background: '#e0e7ff', color: '#4338ca', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <HiOutlineSpeakerWave style={{ width: 24, height: 24 }} />
                {t('scanner.readAloud')}
              </button>

              <button onClick={resetAll} style={{ width: '100%', padding: '16px', background: '#1a1a2e', color: 'white', fontWeight: 600, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>
                {t('scanner.scanAnother')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}