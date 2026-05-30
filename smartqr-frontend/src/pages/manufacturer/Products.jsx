import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCube, HiOutlinePlus, HiOutlineXMark,
  HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlineMagnifyingGlass, HiOutlinePencilSquare,
  HiOutlineTrash, HiOutlineExclamationTriangle,
  HiOutlineSparkles
} from 'react-icons/hi2';
import { getOrgProducts, registerProduct, updateProduct, deleteProduct, aiAutofillProduct } from '../../api/manufacturerApi';
import '../../manufacturer.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);

  const emptyForm = {
    medicineName: '', genericName: '', dosage: '', type: 'Tablet',
    category: 'Painkiller/Antipyretic', composition: '', storage: '',
    dosageInstructions: '', sideEffects: '', contraindications: '',
    prescriptionRequired: false
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const data = await getOrgProducts();
      setProducts(data.products || []);
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
    setEditingProduct(null);
    setForm(emptyForm);
    setShowForm(true);
    setAiFilled(false);
  };

  const handleAiAutofill = async () => {
    if (!form.medicineName || form.medicineName.trim().length < 2) {
      showMsg('Enter a medicine name first (at least 2 characters)', 'error');
      return;
    }
    setAiLoading(true);
    setAiFilled(false);
    try {
      const data = await aiAutofillProduct(form.medicineName.trim());
      if (data.autofill) {
        const a = data.autofill;
        setForm(prev => ({
          ...prev,
          genericName: a.genericName || prev.genericName,
          dosage: a.dosage || prev.dosage,
          type: a.type || prev.type,
          category: a.category || prev.category,
          composition: a.composition || prev.composition,
          storage: a.storage || prev.storage,
          dosageInstructions: a.dosageInstructions || prev.dosageInstructions,
          sideEffects: a.sideEffects || prev.sideEffects,
          contraindications: a.contraindications || prev.contraindications,
          prescriptionRequired: a.prescriptionRequired ?? prev.prescriptionRequired
        }));
        setAiFilled(true);
        showMsg(`AI auto-filled product details for "${form.medicineName}"`);
        setTimeout(() => setAiFilled(false), 6000);
      }
    } catch (err) {
      showMsg('AI autofill failed: ' + err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setForm({
      medicineName: product.medicine_name || '',
      genericName: product.generic_name || '',
      dosage: product.dosage || '',
      type: product.type || 'Tablet',
      category: product.category || 'Painkiller/Antipyretic',
      composition: product.composition || '',
      storage: product.storage || '',
      dosageInstructions: product.dosage_instructions || '',
      sideEffects: product.side_effects || '',
      contraindications: product.contraindications || '',
      prescriptionRequired: product.prescription_required || false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.product_id, form);
        showMsg(`Product "${form.medicineName}" updated successfully!`);
      } else {
        await registerProduct(form);
        showMsg(`Product "${form.medicineName}" registered successfully!`);
      }
      setShowForm(false);
      setEditingProduct(null);
      setForm(emptyForm);
      await loadProducts();
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
      await deleteProduct(deleteConfirm.product_id);
      showMsg(`Product "${deleteConfirm.medicine_name}" deleted successfully!`);
      setDeleteConfirm(null);
      await loadProducts();
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter(p =>
    p.medicine_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
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
          <h1>Product Catalog</h1>
          <p style={{ fontSize: '13px' }}>{products.length} registered product{products.length !== 1 ? 's' : ''} in organization registry</p>
        </div>
        <button onClick={openAddForm} className="mfr-btn mfr-btn-primary" id="add-product-btn">
          <HiOutlinePlus style={{ width: 14, height: 14 }} /> Register Product
        </button>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.25)', backdropFilter: 'blur(8px)', zIndex: 300,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
              }}
              onClick={() => !deleting && setDeleteConfirm(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#fff', borderRadius: 'var(--mfr-radius-lg)', padding: '32px',
                  width: '100%', maxWidth: '420px', boxShadow: 'var(--mfr-shadow-lg)',
                  border: '1px solid var(--mfr-border)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', flexShrink: 0
                  }}>
                    <HiOutlineExclamationTriangle style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--mfr-text-primary)' }}>Delete Product</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--mfr-text-secondary)' }}>This action cannot be undone.</p>
                  </div>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--mfr-text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Are you sure you want to delete <strong style={{ color: 'var(--mfr-text-primary)' }}>{deleteConfirm.medicine_name}</strong> ({deleteConfirm.dosage})? 
                  All associated data will be permanently removed.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setDeleteConfirm(null)} disabled={deleting}
                    className="mfr-btn mfr-btn-outline" style={{ flex: 1, padding: '10px', background: '#fff' }}
                  >Cancel</button>
                  <button 
                    onClick={handleDelete} disabled={deleting}
                    className="mfr-btn" id="confirm-delete-product"
                    style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--mfr-radius-md)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {deleting ? <><div className="mfr-spinner" style={{ borderTopColor: '#fff' }} /> Deleting...</> : <><HiOutlineTrash style={{ width: 15, height: 15 }} /> Delete</>}
                  </button>
                </div>
              </motion.div>
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
                maxWidth: '600px', 
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
                    {editingProduct ? 'Edit Product' : 'Register New Product'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mfr-text-secondary)', margin: '4px 0 0' }}>
                    {editingProduct ? 'Update product metadata in the organization catalog.' : 'Add product metadata to the organization catalog.'}
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
                {/* AI Autofill Banner */}
                {!editingProduct && (
                  <div style={{
                    background: aiFilled ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))' : 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.03))',
                    border: aiFilled ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(139,92,246,0.15)',
                    borderRadius: 'var(--mfr-radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: aiFilled ? '#10b981' : '#7c3aed' }}>
                      <HiOutlineSparkles style={{ width: 16, height: 16 }} />
                      {aiFilled ? 'AI auto-filled all fields — please review' : 'Type medicine name below, then click AI Autofill to populate all fields'}
                    </div>
                    <button
                      type="button"
                      onClick={handleAiAutofill}
                      disabled={aiLoading || !form.medicineName || form.medicineName.trim().length < 2}
                      id="ai-autofill-btn"
                      style={{
                        background: aiLoading ? '#e4e4e7' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        color: aiLoading ? '#71717a' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: aiLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {aiLoading ? (
                        <><div className="mfr-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#71717a' }} /> Analyzing...</>
                      ) : (
                        <><HiOutlineSparkles style={{ width: 14, height: 14 }} /> AI Autofill</>
                      )}
                    </button>
                  </div>
                )}

                <div className="mfr-form-row">
                  <div className="mfr-form-group">
                    <label className="mfr-label">Medicine Name *</label>
                    <input 
                      required className="mfr-input" placeholder="e.g. Paracetamol 500mg"
                      value={form.medicineName} onChange={e => setForm({...form, medicineName: e.target.value})} 
                    />
                  </div>
                  <div className="mfr-form-group">
                    <label className="mfr-label">Generic Name *</label>
                    <input 
                      required className="mfr-input" placeholder="e.g. Acetaminophen"
                      value={form.genericName} onChange={e => setForm({...form, genericName: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="mfr-form-row">
                  <div className="mfr-form-group">
                    <label className="mfr-label">Dosage Strength *</label>
                    <input 
                      required className="mfr-input" placeholder="e.g. 500mg or 10ml"
                      value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} 
                    />
                  </div>
                  <div className="mfr-form-group">
                    <label className="mfr-label">Form Type *</label>
                    <select className="mfr-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Cream</option><option>Drops</option>
                    </select>
                  </div>
                </div>

                <div className="mfr-form-row" style={{ alignItems: 'center' }}>
                  <div className="mfr-form-group" style={{ marginBottom: 0 }}>
                    <label className="mfr-label">Therapeutic Class *</label>
                    <select className="mfr-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option>Painkiller/Antipyretic</option><option>Antibiotic</option><option>Antacid</option><option>Vitamin/Supplement</option><option>Antihistamine</option><option>Cardiovascular</option><option>Dermatological</option><option>Other</option>
                    </select>
                  </div>
                  <div className="mfr-form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '24px', marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: 'var(--mfr-text-secondary)' }}>
                      <input 
                        type="checkbox" checked={form.prescriptionRequired} onChange={e => setForm({...form, prescriptionRequired: e.target.checked})}
                        style={{ width: 16, height: 16, accentColor: '#09090b', cursor: 'pointer' }} 
                      />
                      Prescription Required (Rx)
                    </label>
                  </div>
                </div>

                <div className="mfr-form-group">
                  <label className="mfr-label">Chemical Composition *</label>
                  <input 
                    required className="mfr-input" placeholder="Active ingredients and percentages"
                    value={form.composition} onChange={e => setForm({...form, composition: e.target.value})} 
                  />
                </div>

                <div className="mfr-form-row">
                  <div className="mfr-form-group">
                    <label className="mfr-label">Storage Conditions *</label>
                    <input 
                      required className="mfr-input" placeholder="e.g. Store below 25°C, away from light"
                      value={form.storage} onChange={e => setForm({...form, storage: e.target.value})} 
                    />
                  </div>
                  <div className="mfr-form-group">
                    <label className="mfr-label">Dosage Instructions *</label>
                    <input 
                      required className="mfr-input" placeholder="e.g. 1 tablet twice daily after meals"
                      value={form.dosageInstructions} onChange={e => setForm({...form, dosageInstructions: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="mfr-form-group">
                  <label className="mfr-label">Known Side Effects</label>
                  <textarea 
                    className="mfr-textarea" placeholder="List key side effects (optional)"
                    value={form.sideEffects} onChange={e => setForm({...form, sideEffects: e.target.value})} 
                  />
                </div>

                <div className="mfr-form-group">
                  <label className="mfr-label">Contraindications</label>
                  <textarea 
                    className="mfr-textarea" placeholder="Who should avoid this medicine (optional)"
                    value={form.contraindications} onChange={e => setForm({...form, contraindications: e.target.value})} 
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
                    id="submit-product"
                  >
                    {saving ? <><div className="mfr-spinner" /> Saving...</> : editingProduct ? <>Update Product</> : <>Save Product</>}
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
          placeholder="Filter catalog by medicine name, generic name, or class..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40, height: '44px' }} 
          id="search-products" 
        />
      </div>

      {/* Product Catalog Listing */}
      <div className="mfr-card">
        <div className="mfr-card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="mfr-empty">
              <HiOutlineCube />
              <h4>{products.length === 0 ? 'No products registered' : 'No matching products'}</h4>
              <p>{products.length === 0 ? 'Register your first pharmaceutical product to populate the ledger.' : 'Try adjusting your catalog search filters.'}</p>
            </div>
          ) : (
            <div className="mfr-table-wrap">
              <table className="mfr-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Medicine Name</th>
                    <th>Generic Substance</th>
                    <th>Dosage Strength</th>
                    <th>Form Type</th>
                    <th>Therapeutic Class</th>
                    <th>Classification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((p, i) => (
                      <motion.tr 
                        key={p.product_id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                      >
                        <td style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--mfr-text-muted)' }}>{p.product_id}</td>
                        <td style={{ fontWeight: 700, color: 'var(--mfr-text-primary)' }}>{p.medicine_name}</td>
                        <td style={{ color: 'var(--mfr-text-secondary)', fontSize: '13px' }}>{p.generic_name}</td>
                        <td>{p.dosage}</td>
                        <td>
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--mfr-text-secondary)' }}>
                            {p.type}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--mfr-text-secondary)' }}>{p.category}</td>
                        <td>
                          {p.prescription_required ? (
                            <span 
                              className="mfr-badge" 
                              style={{ 
                                background: 'rgba(217, 119, 6, 0.05)', 
                                color: '#d97706', 
                                borderColor: 'rgba(217, 119, 6, 0.15)',
                                border: '1px solid'
                              }}
                            >
                              Rx Required
                            </span>
                          ) : (
                            <span style={{ color: 'var(--mfr-text-muted)', fontSize: '12.5px' }}>OTC</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => openEditForm(p)}
                              className="mfr-btn mfr-btn-sm mfr-btn-outline"
                              title="Edit product"
                              style={{ padding: '4px 8px', fontSize: '11px', background: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <HiOutlinePencilSquare style={{ width: 13, height: 13 }} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(p)}
                              className="mfr-btn mfr-btn-sm"
                              title="Delete product"
                              style={{ 
                                padding: '4px 8px', fontSize: '11px', background: 'rgba(239,68,68,0.06)', 
                                color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--mfr-radius-sm)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
                              }}
                            >
                              <HiOutlineTrash style={{ width: 13, height: 13 }} /> Delete
                            </button>
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
