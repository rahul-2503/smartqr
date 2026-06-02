import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBuildingOffice2, HiOutlineUserGroup, HiOutlineExclamationTriangle,
  HiOutlineCheckCircle, HiOutlinePencilSquare, HiOutlineTrash,
  HiOutlineShieldCheck, HiOutlineArrowRightOnRectangle, HiOutlineArrowPathRoundedSquare,
  HiOutlineExclamationCircle, HiOutlineUserMinus, HiOutlineChevronUpDown,
  HiOutlineBell, HiOutlineEnvelope, HiOutlineArrowTopRightOnSquare
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import {
  updateOrganization, deleteOrganization,
  updateMemberRole, removeMember, triggerExpiryAlerts
} from '../../api/manufacturerApi';
import '../../manufacturer.css';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

export default function Settings() {
  const { organization, user, isOwner, userRole, refreshOrg, logout } = useAuth();
  const navigate = useNavigate();

  // Form state for company profile editing
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    companyName: '', licenseNo: '', gstNo: '', address: '', state: '', contactName: '', phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Delete org state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Leave org state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Member management
  const [memberLoading, setMemberLoading] = useState(null); // uid of member being updated

  // Alert settings states
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(null);

  useEffect(() => {
    if (organization) {
      setForm({
        companyName: organization.name || '',
        licenseNo: organization.licenseNo || '',
        gstNo: organization.gstNo || '',
        address: organization.address || '',
        state: organization.state || '',
        contactName: organization.contactName || '',
        phone: organization.contactPhone || ''
      });
    }
  }, [organization]);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // ═══ Company Profile ═══
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOrganization(form);
      await refreshOrg();
      setEditMode(false);
      showMsg('Organization profile updated successfully!');
    } catch (err) {
      showMsg(err.message || 'Failed to update organization', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ═══ Delete Organization ═══
  const handleDeleteOrg = async () => {
    setDeleting(true);
    try {
      await deleteOrganization();
      await logout();
      navigate('/manufacturer/login');
    } catch (err) {
      showMsg(err.message || 'Failed to delete organization', 'error');
      setDeleting(false);
    }
  };

  // ═══ Leave Organization ═══
  const handleLeaveOrg = async () => {
    setLeaving(true);
    try {
      await removeMember(user.uid);
      await logout();
      navigate('/manufacturer/login');
    } catch (err) {
      showMsg(err.message || 'Failed to leave organization', 'error');
      setLeaving(false);
    }
  };

  // ═══ Member Role Update ═══
  const handleRoleChange = async (targetUid, newRole) => {
    setMemberLoading(targetUid);
    try {
      await updateMemberRole(targetUid, newRole);
      await refreshOrg();
      showMsg(`Member role updated to ${newRole}`);
    } catch (err) {
      showMsg(err.message || 'Failed to update role', 'error');
    } finally {
      setMemberLoading(null);
    }
  };

  // ═══ Remove Member ═══
  const handleRemoveMember = async (targetUid, email) => {
    if (!window.confirm(`Remove ${email} from the organization?`)) return;
    setMemberLoading(targetUid);
    try {
      await removeMember(targetUid);
      await refreshOrg();
      showMsg(`${email} removed from organization`);
    } catch (err) {
      showMsg(err.message || 'Failed to remove member', 'error');
    } finally {
      setMemberLoading(null);
    }
  };

  // ═══ Trigger Alert Test ═══
  const handleTriggerAlertTest = async () => {
    setAlertLoading(true);
    setAlertSuccess(null);
    try {
      const res = await triggerExpiryAlerts();
      if (res.success) {
        setAlertSuccess({
          message: res.message,
          previewUrl: res.previewUrl,
          isEthereal: res.isEthereal,
          recipients: res.recipients
        });
        showMsg(res.message);
      }
    } catch (err) {
      showMsg(err.message || 'Failed to trigger alert test', 'error');
    } finally {
      setAlertLoading(false);
    }
  };

  const members = organization?.members || [];

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: '#fafafa', border: '1px solid var(--mfr-border)',
    borderRadius: 'var(--mfr-radius-md)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
    color: 'var(--mfr-text-primary)', transition: 'border-color 0.15s', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--mfr-text-secondary)', marginBottom: '6px', display: 'block' };
  const readOnlyValueStyle = { fontSize: '13.5px', fontWeight: 500, color: 'var(--mfr-text-primary)' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Page Header */}
      <div className="mfr-page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your organization profile, team members, and workspace configuration.</p>
        </div>
        <div className="mfr-page-header-actions">
          <span style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            background: isOwner ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            color: isOwner ? '#059669' : '#2563eb',
            border: `1px solid ${isOwner ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <HiOutlineShieldCheck style={{ width: 14, height: 14 }} />
            {isOwner ? 'Owner' : 'Employee'}
          </span>
        </div>
      </div>

      {/* Toast Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mfr-alert ${message.type === 'error' ? 'mfr-alert-error' : 'mfr-alert-success'}`}
            style={{ marginBottom: '20px' }}
          >
            {message.type === 'error' ? <HiOutlineExclamationCircle /> : <HiOutlineCheckCircle />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ═══ Section 1: Company Profile ═══ */}
        <div className="mfr-card">
          <div className="mfr-card-header" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <HiOutlineBuildingOffice2 style={{ width: 18, height: 18, color: 'var(--mfr-text-secondary)' }} />
                Company Profile
              </h3>
              {isOwner && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="mfr-btn mfr-btn-outline"
                  style={{ background: '#ffffff', gap: '6px' }}
                  id="edit-profile-btn"
                >
                  <HiOutlinePencilSquare style={{ width: 14, height: 14 }} /> Edit
                </button>
              )}
            </div>
          </div>
          <div className="mfr-card-body" style={{ padding: '24px' }}>
            {editMode && isOwner ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Company Name *</label>
                    <input
                      required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                      style={inputStyle} id="settings-company-name"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Name</label>
                    <input
                      value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Drug License No.</label>
                    <input
                      value={form.licenseNo} onChange={e => setForm({ ...form, licenseNo: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>GSTIN Number</label>
                    <input
                      value={form.gstNo} onChange={e => setForm({ ...form, gstNo: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Address</label>
                  <input
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>State</label>
                    <select
                      value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Choose State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Phone</label>
                    <input
                      value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setForm({ companyName: organization?.name || '', licenseNo: organization?.licenseNo || '', gstNo: organization?.gstNo || '', address: organization?.address || '', state: organization?.state || '', contactName: organization?.contactName || '', phone: organization?.contactPhone || '' }); }}
                    className="mfr-btn mfr-btn-outline"
                    style={{ background: '#ffffff' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="mfr-btn mfr-btn-primary"
                    id="save-profile-btn"
                  >
                    {saving ? (
                      <><div className="mfr-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
                    ) : (
                      <><HiOutlineCheckCircle style={{ width: 15, height: 15 }} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[
                  { label: 'Company Name', value: organization?.name },
                  { label: 'Contact Name', value: organization?.contactName },
                  { label: 'Drug License No.', value: organization?.licenseNo },
                  { label: 'GSTIN', value: organization?.gstNo },
                  { label: 'Address', value: organization?.address },
                  { label: 'State', value: organization?.state },
                  { label: 'Contact Email', value: organization?.contactEmail },
                  { label: 'Contact Phone', value: organization?.contactPhone },
                  { label: 'Domain', value: organization?.domain },
                  { label: 'Registered', value: organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }
                ].map(item => (
                  <div key={item.label}>
                    <div style={labelStyle}>{item.label}</div>
                    <div style={readOnlyValueStyle}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Section 2: Team Members ═══ */}
        <div className="mfr-card">
          <div className="mfr-card-header" style={{ padding: '20px 24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <HiOutlineUserGroup style={{ width: 18, height: 18, color: 'var(--mfr-text-secondary)' }} />
              Team Members
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                background: 'var(--mfr-bg-secondary)', borderRadius: '999px',
                color: 'var(--mfr-text-muted)'
              }}>
                {members.length}
              </span>
            </h3>
          </div>
          <div className="mfr-card-body" style={{ padding: 0 }}>
            {members.length === 0 ? (
              <div className="mfr-empty" style={{ padding: '40px' }}>
                <HiOutlineUserGroup />
                <h4>No members found</h4>
              </div>
            ) : (
              <div className="mfr-table-wrap">
                <table className="mfr-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Joined</th>
                      {isOwner && <th style={{ width: '120px' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => {
                      const isSelf = member.uid === user?.uid || member.email === user?.email;
                      const isLoading = memberLoading === member.uid;
                      return (
                        <tr key={member.uid || member.email}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: member.role === 'owner' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', fontWeight: 700,
                                color: member.role === 'owner' ? '#059669' : '#2563eb'
                              }}>
                                {member.email?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mfr-text-primary)' }}>
                                  {member.email}
                                  {isSelf && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mfr-text-muted)', marginLeft: '6px' }}>(You)</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isOwner && !isSelf ? (
                              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                <select
                                  value={member.role}
                                  onChange={e => handleRoleChange(member.uid, e.target.value)}
                                  disabled={isLoading}
                                  style={{
                                    appearance: 'none', padding: '4px 28px 4px 10px', borderRadius: '6px',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--mfr-border)',
                                    background: member.role === 'owner' ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)',
                                    color: member.role === 'owner' ? '#059669' : '#2563eb',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  <option value="owner">Owner</option>
                                  <option value="employee">Employee</option>
                                </select>
                                <HiOutlineChevronUpDown style={{ position: 'absolute', right: '6px', width: 14, height: 14, pointerEvents: 'none', color: '#71717a' }} />
                              </div>
                            ) : (
                              <span style={{
                                padding: '4px 10px', borderRadius: '6px',
                                fontSize: '12px', fontWeight: 600,
                                background: member.role === 'owner' ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)',
                                color: member.role === 'owner' ? '#059669' : '#2563eb'
                              }}>
                                {member.role === 'owner' ? 'Owner' : 'Employee'}
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--mfr-text-muted)' }}>
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          {isOwner && (
                            <td>
                              {!isSelf && (
                                <button
                                  onClick={() => handleRemoveMember(member.uid, member.email)}
                                  disabled={isLoading}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                                    borderRadius: '6px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px',
                                    fontSize: '12px', fontWeight: 600, transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  {isLoading ? (
                                    <div className="mfr-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#dc2626' }} />
                                  ) : (
                                    <><HiOutlineUserMinus style={{ width: 14, height: 14 }} /> Remove</>
                                  )}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Section 2.5: Alert & Notification Settings ═══ */}
        <div className="mfr-card">
          <div className="mfr-card-header" style={{ padding: '20px 24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <HiOutlineBell style={{ width: 18, height: 18, color: 'var(--mfr-text-secondary)' }} />
              Alert & Notification Settings
            </h3>
          </div>
          <div className="mfr-card-body" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: '1 1 350px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mfr-text-primary)', marginBottom: '4px' }}>
                  Automated Batch Expiry Notifications
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--mfr-text-muted)', lineHeight: 1.5 }}>
                  The system scans all batch runs daily and automatically dispatches warning reports to all workspace members when products approach expiration. Warning stages are categorized as:
                  <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '12px' }}>
                    <li style={{ marginBottom: '4px' }}><strong style={{ color: '#dc2626' }}>Critical Warning</strong>: 10 days or less before expiration</li>
                    <li style={{ marginBottom: '4px' }}><strong style={{ color: '#ea580c' }}>Urgent Warning</strong>: 11 to 15 days before expiration</li>
                    <li style={{ marginBottom: '4px' }}><strong style={{ color: '#eab308' }}>Standard Warning</strong>: 16 to 30 days before expiration</li>
                  </ul>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
                <button
                  onClick={handleTriggerAlertTest}
                  disabled={alertLoading}
                  className="mfr-btn mfr-btn-outline"
                  style={{
                    background: '#ffffff', fontWeight: 600, gap: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                  id="test-expiry-alert-btn"
                >
                  {alertLoading ? (
                    <><div className="mfr-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Dispatching...</>
                  ) : (
                    <><HiOutlineEnvelope style={{ width: 15, height: 15 }} /> Send Test Expiry Alert</>
                  )}
                </button>
              </div>
            </div>

            {/* Test Email Preview Container */}
            <AnimatePresence>
              {alertSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(16,185,129,0.05)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 'var(--mfr-radius-md)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineCheckCircle style={{ width: 16, height: 16 }} />
                    Alert Email Dispatched Successfully!
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--mfr-text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                    {alertSuccess.message}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mfr-text-muted)', marginTop: '4px' }}>
                    Recipients: <strong>{alertSuccess.recipients.join(', ')}</strong>
                  </div>
                  {alertSuccess.isEthereal && alertSuccess.previewUrl && (
                    <div style={{ marginTop: '12px' }}>
                      <a
                        href={alertSuccess.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'white',
                          color: '#059669',
                          border: '1px solid rgba(16,185,129,0.25)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          boxShadow: 'var(--mfr-shadow-sm)'
                        }}
                      >
                        <HiOutlineArrowTopRightOnSquare style={{ width: 14, height: 14 }} />
                        View Rendered Test Email in Browser
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ═══ Section 3: Danger Zone (Owner) / Leave Org (Employee) ═══ */}
        {isOwner ? (
          <div className="mfr-card" style={{ border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <div className="mfr-card-header" style={{ padding: '20px 24px', background: 'rgba(220, 38, 38, 0.02)', borderBottom: '1px solid rgba(220, 38, 38, 0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#dc2626' }}>
                <HiOutlineExclamationTriangle style={{ width: 18, height: 18 }} />
                Danger Zone
              </h3>
            </div>
            <div className="mfr-card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mfr-text-primary)', marginBottom: '4px' }}>
                    Delete this organization
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--mfr-text-muted)', lineHeight: 1.5 }}>
                    Permanently delete <strong>{organization?.name}</strong> and all associated data including products, batches, scans, and audit logs. This action cannot be undone.
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="mfr-btn"
                  style={{
                    background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)',
                    fontWeight: 600, gap: '6px', flexShrink: 0
                  }}
                  id="delete-org-btn"
                >
                  <HiOutlineTrash style={{ width: 15, height: 15 }} /> Delete Organization
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mfr-card" style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div className="mfr-card-header" style={{ padding: '20px 24px', background: 'rgba(245, 158, 11, 0.02)', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#d97706' }}>
                <HiOutlineArrowRightOnRectangle style={{ width: 18, height: 18 }} />
                My Account
              </h3>
            </div>
            <div className="mfr-card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mfr-text-primary)', marginBottom: '4px' }}>
                    Leave this organization
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--mfr-text-muted)', lineHeight: 1.5 }}>
                    Remove yourself from <strong>{organization?.name}</strong>. You will lose access to all organization data.
                  </div>
                </div>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="mfr-btn"
                  style={{
                    background: 'rgba(245,158,11,0.06)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)',
                    fontWeight: 600, gap: '6px', flexShrink: 0
                  }}
                  id="leave-org-btn"
                >
                  <HiOutlineArrowRightOnRectangle style={{ width: 15, height: 15 }} /> Leave Organization
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Delete Organization Confirmation Modal ═══ */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
            }}
            onClick={() => { if (!deleting) setShowDeleteModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#ffffff', borderRadius: '16px', padding: '32px',
                maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
                  background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <HiOutlineExclamationTriangle style={{ width: 28, height: 28, color: '#dc2626' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', margin: '0 0 8px' }}>
                  Delete Organization
                </h3>
                <p style={{ fontSize: '13px', color: '#71717a', lineHeight: 1.6 }}>
                  This will <strong>permanently delete</strong> all products, batches, scans, and audit logs for <strong>{organization?.name}</strong>. This action is irreversible.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', marginBottom: '6px', display: 'block' }}>
                  Type <strong style={{ color: '#dc2626' }}>{organization?.name}</strong> to confirm
                </label>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={organization?.name}
                  disabled={deleting}
                  style={{
                    ...inputStyle,
                    borderColor: deleteConfirmText === organization?.name ? '#dc2626' : 'var(--mfr-border)'
                  }}
                  id="delete-confirm-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  disabled={deleting}
                  className="mfr-btn mfr-btn-outline"
                  style={{ flex: 1, background: '#ffffff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrg}
                  disabled={deleteConfirmText !== organization?.name || deleting}
                  className="mfr-btn"
                  style={{
                    flex: 1,
                    background: deleteConfirmText === organization?.name ? '#dc2626' : '#e4e4e7',
                    color: deleteConfirmText === organization?.name ? '#ffffff' : '#a1a1aa',
                    border: 'none', fontWeight: 700
                  }}
                  id="confirm-delete-btn"
                >
                  {deleting ? (
                    <><div className="mfr-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#ffffff' }} /> Deleting...</>
                  ) : (
                    <><HiOutlineTrash style={{ width: 15, height: 15 }} /> Delete Forever</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Leave Organization Confirmation Modal ═══ */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
            }}
            onClick={() => { if (!leaving) setShowLeaveModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#ffffff', borderRadius: '16px', padding: '32px',
                maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
                  background: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <HiOutlineArrowRightOnRectangle style={{ width: 28, height: 28, color: '#d97706' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', margin: '0 0 8px' }}>
                  Leave Organization?
                </h3>
                <p style={{ fontSize: '13px', color: '#71717a', lineHeight: 1.6 }}>
                  You will lose access to <strong>{organization?.name}</strong> and all its data. You can rejoin later by signing in with the same email.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  disabled={leaving}
                  className="mfr-btn mfr-btn-outline"
                  style={{ flex: 1, background: '#ffffff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveOrg}
                  disabled={leaving}
                  className="mfr-btn"
                  style={{
                    flex: 1, background: '#d97706', color: '#ffffff',
                    border: 'none', fontWeight: 700
                  }}
                  id="confirm-leave-btn"
                >
                  {leaving ? (
                    <><div className="mfr-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#ffffff' }} /> Leaving...</>
                  ) : (
                    'Leave Organization'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
