import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArchiveBox, HiOutlinePlus, HiOutlineXMark,
  HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlineQrCode, HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare, HiOutlineTrash,
  HiOutlineExclamationTriangle, HiOutlineSparkles
} from 'react-icons/hi2';
import { getOrgProducts, registerBatch, updateBatch, deleteBatch, aiBatchAssist } from '../../api/manufacturerApi';
import '../../manufacturer.css';

export default function Batches() {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const emptyForm = {
    productId: '', batchNo: '', mfgDate: '', expDate: '',
    tabletsPerStrip: 10, totalStrips: 100, mrp: '', warnings: ''
  };

  const [form, setForm] = useState(emptyForm);

  const getProductTypeInfo = (productId) => {
    const p = products.find(prod => prod.product_id === productId);
    if (!p) return { type: 'Tablet', isSingleUnit: false, packLabel: 'Strip', packLabelPlural: 'Strips', unitLabel: 'tablet', unitLabelPlural: 'tablets' };
    
    const type = p.type || 'Tablet';
    switch (type) {
      case 'Cream':
        return { type, isSingleUnit: true, packLabel: 'Tube', packLabelPlural: 'Tubes', unitLabel: 'tube', unitLabelPlural: 'tubes' };
      case 'Syrup':
        return { type, isSingleUnit: true, packLabel: 'Bottle', packLabelPlural: 'Bottles', unitLabel: 'bottle', unitLabelPlural: 'bottles' };
      case 'Injection':
        return { type, isSingleUnit: true, packLabel: 'Vial', packLabelPlural: 'Vials', unitLabel: 'vial', unitLabelPlural: 'vials' };
      case 'Drops':
        return { type, isSingleUnit: true, packLabel: 'Bottle', packLabelPlural: 'Bottles', unitLabel: 'bottle', unitLabelPlural: 'bottles' };
      case 'Capsule':
        return { type, isSingleUnit: false, packLabel: 'Pack', packLabelPlural: 'Packs', unitLabel: 'capsule', unitLabelPlural: 'capsules' };
      case 'Tablet':
      default:
        return { type, isSingleUnit: false, packLabel: 'Strip', packLabelPlural: 'Strips', unitLabel: 'tablet', unitLabelPlural: 'tablets' };
    }
  };

  const typeInfo = getProductTypeInfo(form.productId);

  const handleProductChange = (productId) => {
    const selectedProduct = products.find(p => p.product_id === productId);
    let tabletsPerStrip = 10;
    if (selectedProduct) {
      const type = selectedProduct.type;
      const isSingleUnit = ['Cream', 'Syrup', 'Injection', 'Drops'].includes(type);
      tabletsPerStrip = isSingleUnit ? 1 : 10;
    }
    setForm(prev => ({
      ...prev,
      productId,
      tabletsPerStrip
    }));
  };

  const formatPackagingConfig = (batch) => {
    const p = products.find(prod => prod.product_id === batch.product_id);
    if (!p) return `${batch.tablets_per_strip} units × ${batch.total_strips}`;
    const type = p.type || 'Tablet';
    switch (type) {
      case 'Cream':
        return `1 tube × ${batch.total_strips} tubes`;
      case 'Syrup':
        return `1 bottle × ${batch.total_strips} bottles`;
      case 'Injection':
        return `1 vial × ${batch.total_strips} vials`;
      case 'Drops':
        return `1 bottle × ${batch.total_strips} bottles`;
      case 'Capsule':
        return `${batch.tablets_per_strip} capsules × ${batch.total_strips} packs`;
      case 'Tablet':
      default:
        return `${batch.tablets_per_strip} tablets × ${batch.total_strips} strips`;
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await getOrgProducts();
      setProducts(data.products || []);
      setBatches(data.batches || []);
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

  const openAddForm = () => {
    setEditingBatch(null);
    setForm(emptyForm);
    setShowForm(true);
    setAiAnalysis(null);
  };

  const handleAiAssist = async () => {
    if (!form.productId || !form.mfgDate || !form.expDate) return;
    setAiLoading(true);
    try {
      const data = await aiBatchAssist({
        productId: form.productId,
        mfgDate: form.mfgDate,
        expDate: form.expDate,
        mrp: form.mrp,
        tabletsPerStrip: form.tabletsPerStrip,
        totalStrips: form.totalStrips
      });
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('AI Batch assist error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const openEditForm = (batch) => {
    setEditingBatch(batch);
    setForm({
      productId: batch.product_id || '',
      batchNo: batch.batch_id || '',
      mfgDate: batch.mfg_date || '',
      expDate: batch.exp_date || '',
      tabletsPerStrip: batch.tablets_per_strip || 10,
      totalStrips: batch.total_strips || 100,
      mrp: batch.mrp || '',
      warnings: batch.warnings || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBatch) {
        await updateBatch(editingBatch.batch_id, form);
        showMsg(`Batch "${editingBatch.batch_id}" updated successfully!`);
      } else {
        await registerBatch(form);
        showMsg(`Batch "${form.batchNo}" registered successfully! ${(form.tabletsPerStrip * form.totalStrips).toLocaleString()} QR codes are ready.`);
      }
      setShowForm(false);
      setEditingBatch(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteBatch(deleteConfirm.batch_id);
      showMsg(`Batch "${deleteConfirm.batch_id}" deleted successfully!`);
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = batches.filter(b =>
    b.batch_id?.toLowerCase().includes(search.toLowerCase()) ||
    b.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="mfr-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div className="mfr-page-header">
        <div>
          <h1>Batch Ledger</h1>
          <p style={{ fontSize: '13px' }}>{batches.length} active batch runs across {products.length} catalog products</p>
        </div>
        <div className="mfr-page-header-actions">
          <Link to="/manufacturer/qr-center" className="mfr-btn mfr-btn-outline" style={{ background: '#ffffff' }}>
            <HiOutlineQrCode style={{ width: 15, height: 15 }} /> QR Center
          </Link>
          <button 
            onClick={openAddForm} 
            className="mfr-btn mfr-btn-primary" 
            disabled={products.length === 0} 
            id="add-batch-btn"
          >
            <HiOutlinePlus style={{ width: 14, height: 14 }} /> Register Batch
          </button>
        </div>
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

      {products.length === 0 && (
        <div className="mfr-alert mfr-alert-warning">
          <HiOutlineExclamationCircle />
          <span>You need to register at least one product before creating manufacturing batch runs. </span>
          <Link to="/manufacturer/products" style={{ fontWeight: 700, color: 'inherit', marginLeft: '6px' }}>Go to Products Catalog →</Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.25)', backdropFilter: 'blur(8px)', zIndex: 300 }}
              onClick={() => !deleting && setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: '#fff', borderRadius: 'var(--mfr-radius-lg)', padding: '32px',
                width: '100%', maxWidth: '420px', zIndex: 301, boxShadow: 'var(--mfr-shadow-lg)',
                border: '1px solid var(--mfr-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', flexShrink: 0
                }}>
                  <HiOutlineExclamationTriangle style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--mfr-text-primary)' }}>Delete Batch</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--mfr-text-secondary)' }}>This action cannot be undone.</p>
                </div>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--mfr-text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
                Are you sure you want to delete batch <strong style={{ color: 'var(--mfr-text-primary)', fontFamily: 'monospace' }}>{deleteConfirm.batch_id}</strong> 
                {deleteConfirm.product_name ? ` (${deleteConfirm.product_name})` : ''}? 
                All {(deleteConfirm.total_tablets || 0).toLocaleString()} associated QR codes will be invalidated.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setDeleteConfirm(null)} disabled={deleting}
                  className="mfr-btn mfr-btn-outline" style={{ flex: 1, padding: '10px', background: '#fff' }}
                >Cancel</button>
                <button 
                  onClick={handleDelete} disabled={deleting}
                  className="mfr-btn" id="confirm-delete-batch"
                  style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--mfr-radius-md)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {deleting ? <><div className="mfr-spinner" style={{ borderTopColor: '#fff' }} /> Deleting...</> : <><HiOutlineTrash style={{ width: 15, height: 15 }} /> Delete</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drawer slide-over overlay */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Dark glass backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ 
                position: 'fixed', 
                inset: 0, 
                background: 'rgba(9, 9, 11, 0.15)', 
                backdropFilter: 'blur(8px)',
                zIndex: 200 
              }}
              onClick={() => setShowForm(false)}
            />

            {/* Slide-over Drawer panel */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              style={{ 
                position: 'fixed', 
                top: 0, 
                right: 0, 
                bottom: 0, 
                width: '100%', 
                maxWidth: '580px', 
                background: '#ffffff', 
                boxShadow: 'var(--mfr-shadow-lg)',
                borderLeft: '1px solid var(--mfr-border)',
                zIndex: 201, 
                display: 'flex', 
                flexDirection: 'column'
              }}
            >
              {/* Drawer Header */}
              <div 
                style={{ 
                  padding: '24px 32px', 
                  borderBottom: '1px solid var(--mfr-border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--mfr-text-primary)' }}>
                    {editingBatch ? `Edit Batch — ${editingBatch.batch_id}` : 'Register New Batch'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', margin: '4px 0 0' }}>
                    {editingBatch ? 'Update batch manufacturing details.' : 'Generate distinct tracking codes for a product manufacturing run.'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--mfr-text-muted)',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <HiOutlineXMark style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form 
                onSubmit={handleSubmit} 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '32px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '20px' 
                }}
              >
                <div className="mfr-form-group">
                  <label className="mfr-label">Select Associated Product *</label>
                  <select 
                    required className="mfr-select" value={form.productId} 
                    onChange={e => handleProductChange(e.target.value)}
                    disabled={!!editingBatch}
                  >
                    <option value="">— Choose Product —</option>
                    {products.map(p => <option key={p.product_id} value={p.product_id}>{p.medicine_name} ({p.dosage})</option>)}
                  </select>
                  {editingBatch && (
                    <p style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', marginTop: '4px' }}>Product cannot be changed after batch creation.</p>
                  )}
                </div>

                <div className="mfr-form-row">
                  <div className="mfr-form-group">
                    <label className="mfr-label">Batch Reference Number *</label>
                    <input 
                      required className="mfr-input" placeholder="e.g. BT-2026-05"
                      value={form.batchNo} onChange={e => setForm({...form, batchNo: e.target.value})} 
                      disabled={!!editingBatch}
                    />
                  </div>
                  <div className="mfr-form-group">
                    <label className="mfr-label">MRP per Unit (₹) *</label>
                    <input 
                      required type="number" step="0.01" className="mfr-input" placeholder="e.g. 150.00"
                      value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="mfr-form-row">
                  <div className="mfr-form-group">
                    <label className="mfr-label">Manufacturing Date *</label>
                    <input 
                      required type="date" className="mfr-input"
                      value={form.mfgDate} onChange={e => setForm({...form, mfgDate: e.target.value})} 
                    />
                  </div>
                  <div className="mfr-form-group">
                    <label className="mfr-label">Expiration Date *</label>
                    <input 
                      required type="date" className="mfr-input"
                      value={form.expDate} onChange={e => setForm({...form, expDate: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="mfr-form-row">
                  <div className="mfr-form-group">
                    <label className="mfr-label">
                      {typeInfo.isSingleUnit ? 'Units per Package' : 'Items per Strip/Pack *'}
                    </label>
                    {typeInfo.isSingleUnit ? (
                      <select className="mfr-select" value={1} disabled>
                        <option value={1}>1 unit (Single {typeInfo.packLabel})</option>
                      </select>
                    ) : (
                      <select className="mfr-select" value={form.tabletsPerStrip} onChange={e => setForm({...form, tabletsPerStrip: parseInt(e.target.value)})}>
                        <option value={4}>4 units</option>
                        <option value={6}>6 units</option>
                        <option value={10}>10 units</option>
                        <option value={15}>15 units</option>
                      </select>
                    )}
                  </div>
                  <div className="mfr-form-group">
                    <label className="mfr-label">Total {typeInfo.packLabelPlural} *</label>
                    <input 
                      required type="number" min="1" className="mfr-input" placeholder="e.g. 100"
                      value={form.totalStrips} onChange={e => setForm({...form, totalStrips: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                </div>

                {/* dynamic QR summary card */}
                <div 
                  style={{ 
                    background: 'var(--mfr-success-bg)', 
                    padding: '16px 20px', 
                    borderRadius: 'var(--mfr-radius-md)', 
                    border: '1px solid var(--mfr-success-border)' 
                  }}
                >
                  <div style={{ fontSize: '13px', color: 'var(--mfr-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineQrCode style={{ width: 16, height: 16 }} />
                    Generated Codes Count: {(form.tabletsPerStrip * (form.totalStrips || 0)).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', marginTop: '4px' }}>
                    {typeInfo.isSingleUnit ? (
                      `1 unit × ${form.totalStrips || 0} ${typeInfo.packLabelPlural.toLowerCase()} = ${(form.tabletsPerStrip * (form.totalStrips || 0)).toLocaleString()} individual tracking barcodes.`
                    ) : (
                      `${form.totalStrips || 0} ${typeInfo.packLabelPlural.toLowerCase()} × ${form.tabletsPerStrip} items/${typeInfo.packLabel.toLowerCase()} = ${(form.tabletsPerStrip * (form.totalStrips || 0)).toLocaleString()} individual tracking barcodes.`
                    )}
                  </div>
                </div>

                {/* AI Batch Assistant Section */}
                {!editingBatch && (
                  <div style={{
                    background: aiAnalysis ? 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(59,130,246,0.02))' : 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(59,130,246,0.02))',
                    border: '1px solid ' + (aiAnalysis ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)'),
                    borderRadius: 'var(--mfr-radius-md)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: aiAnalysis ? '#10b981' : '#7c3aed' }}>
                        <HiOutlineSparkles style={{ width: 15, height: 15 }} />
                        AI Batch Assistant
                      </div>
                      <button
                        type="button"
                        onClick={handleAiAssist}
                        disabled={aiLoading || !form.productId || !form.mfgDate || !form.expDate}
                        id="ai-batch-assist-btn"
                        style={{
                          background: aiLoading ? '#e4e4e7' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                          color: aiLoading ? '#71717a' : '#fff',
                          border: 'none', borderRadius: '6px', padding: '5px 12px',
                          fontSize: '11px', fontWeight: 700, cursor: aiLoading ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        {aiLoading ? <><div className="mfr-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#71717a' }} /> Analyzing...</> : 'Analyze Batch'}
                      </button>
                    </div>
                    {aiAnalysis && (
                      <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Risk Level Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                            background: aiAnalysis.riskLevel === 'HIGH' ? 'rgba(220,38,38,0.08)' : aiAnalysis.riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                            color: aiAnalysis.riskLevel === 'HIGH' ? '#dc2626' : aiAnalysis.riskLevel === 'MEDIUM' ? '#d97706' : '#10b981',
                            border: '1px solid ' + (aiAnalysis.riskLevel === 'HIGH' ? 'rgba(220,38,38,0.2)' : aiAnalysis.riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)')
                          }}>{aiAnalysis.riskLevel} RISK</span>
                          <span style={{ fontSize: '11px', color: 'var(--mfr-text-muted)' }}>{aiAnalysis.shelfLifeAssessment}</span>
                        </div>
                        {/* Compliance Flags */}
                        {aiAnalysis.complianceFlags?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {aiAnalysis.complianceFlags.map((flag, i) => (
                              <div key={i} style={{ fontSize: '11.5px', color: '#d97706', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                <HiOutlineExclamationTriangle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                                <span>{flag}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* AI Warnings with Apply Button */}
                        {aiAnalysis.warnings && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <span style={{ fontSize: '11.5px', color: 'var(--mfr-text-secondary)', flex: 1 }}>{aiAnalysis.warnings.substring(0, 120)}...</span>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, warnings: aiAnalysis.warnings }))}
                              style={{ fontSize: '10.5px', fontWeight: 700, color: '#7c3aed', background: 'none', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >Apply</button>
                          </div>
                        )}
                        {/* Suggestions */}
                        {aiAnalysis.suggestions?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {aiAnalysis.suggestions.slice(0, 3).map((s, i) => (
                              <div key={i} style={{ fontSize: '11px', color: 'var(--mfr-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span> {s}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mfr-form-group">
                  <label className="mfr-label">Batch Specific Warnings (Optional)</label>
                  <textarea 
                    className="mfr-textarea" placeholder="Enter warnings or specific instructions for this run..."
                    value={form.warnings} onChange={e => setForm({...form, warnings: e.target.value})} 
                  />
                </div>

                {/* Drawer Footer Actions */}
                <div 
                  style={{ 
                    borderTop: '1px solid var(--mfr-border)', 
                    paddingTop: '24px', 
                    marginTop: 'auto', 
                    display: 'flex', 
                    gap: '12px' 
                  }}
                >
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="mfr-btn mfr-btn-outline" 
                    style={{ flex: 1, padding: '12px', background: '#ffffff' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="mfr-btn mfr-btn-primary" 
                    style={{ flex: 2, padding: '12px' }} 
                    id="submit-batch"
                  >
                    {saving ? <><div className="mfr-spinner" /> Generating...</> : editingBatch ? <>Update Batch</> : <>Save & Generate QR Codes</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter / Search Bar */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <HiOutlineMagnifyingGlass 
          style={{ 
            position: 'absolute', 
            left: 14, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            width: 16, 
            height: 16, 
            color: 'var(--mfr-text-muted)' 
          }} 
        />
        <input 
          className="mfr-input" 
          placeholder="Filter batches by Batch ID or medicine name..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40, height: '44px' }} 
          id="search-batches" 
        />
      </div>

      {/* Batches Catalog Table */}
      <div className="mfr-card">
        <div className="mfr-card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="mfr-empty">
              <HiOutlineArchiveBox />
              <h4>{batches.length === 0 ? 'No batches registered' : 'No matching batches'}</h4>
              <p>{batches.length === 0 ? 'Associate your registered products with distinct batch numbers.' : 'Try adjusting your search filters.'}</p>
            </div>
          ) : (
            <div className="mfr-table-wrap">
              <table className="mfr-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Product</th>
                    <th>Mfg Date</th>
                    <th>Expiration</th>
                    <th>Packaging Config</th>
                    <th>QR Codes</th>
                    <th>MRP</th>
                    <th>Safety Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((b, i) => (
                      <motion.tr 
                        key={b.batch_id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                      >
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12.5px', color: 'var(--mfr-text-primary)' }}>{b.batch_id}</td>
                        <td style={{ fontWeight: 700 }}>{b.product_name || '—'}</td>
                        <td style={{ fontSize: '12.5px', color: 'var(--mfr-text-secondary)' }}>{b.mfg_date}</td>
                        <td style={{ fontSize: '12.5px', color: 'var(--mfr-text-secondary)' }}>{b.exp_date}</td>
                        <td style={{ fontSize: '12px', color: 'var(--mfr-text-muted)', textTransform: 'lowercase' }}>{formatPackagingConfig(b)}</td>
                        <td style={{ fontWeight: 600, color: 'var(--mfr-text-primary)' }}>{(b.total_tablets || 0).toLocaleString()}</td>
                        <td style={{ fontSize: '12.5px', color: 'var(--mfr-text-secondary)', fontWeight: 600 }}>₹{b.mrp}</td>
                        <td>
                          <span className={`mfr-badge ${b.status === 'SAFE' ? 'mfr-badge-safe' : b.status === 'EXPIRED' ? 'mfr-badge-danger' : 'mfr-badge-warning'}`}>
                            {b.status === 'SAFE' ? 'Safe' : b.status === 'EXPIRED' ? 'Expired' : `${b.days_left}d left`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openEditForm(b)}
                              className="mfr-btn mfr-btn-sm mfr-btn-outline"
                              title="Edit batch"
                              style={{ padding: '4px 7px', fontSize: '11px', background: '#fff', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <HiOutlinePencilSquare style={{ width: 12, height: 12 }} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(b)}
                              className="mfr-btn mfr-btn-sm"
                              title="Delete batch"
                              style={{ 
                                padding: '4px 7px', fontSize: '11px', background: 'rgba(239,68,68,0.06)', 
                                color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--mfr-radius-sm)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600
                              }}
                            >
                              <HiOutlineTrash style={{ width: 12, height: 12 }} />
                            </button>
                            <Link 
                              to={`/manufacturer/qr-center?batch=${b.batch_id}&product=${b.product_id}`}
                              className="mfr-btn mfr-btn-sm mfr-btn-outline"
                              style={{ padding: '4px 7px', fontSize: '11px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <HiOutlineQrCode style={{ width: 12, height: 12 }} /> QR
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
