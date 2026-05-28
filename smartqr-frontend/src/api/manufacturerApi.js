import { auth } from '../config/firebase';

const API_BASE = import.meta.env.VITE_API_BASE || (
  (window.location.hostname === 'localhost' && !navigator.webdriver)
    ? 'http://localhost:7071/api'
    : 'https://smartqr-api-rahul-f8hpaqeudbdeesa5.centralindia-01.azurewebsites.net/api'
);


/**
 * Get Firebase auth token for API requests
 */
async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated. Please sign in.');
  try {
    return await user.getIdToken();
  } catch (error) {
    throw new Error('Session expired. Please sign in again.');
  }
}

/**
 * Authenticated fetch helper
 */
async function authFetch(endpoint, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (res.status === 401) {
    throw new Error('Session expired. Please sign in again.');
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    if (!res.ok) {
      throw new Error(`Server error (${res.status}). The system might be updating.`);
    }
    data = {};
  }
  
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}

// ═══ Organization APIs ═══

export async function getOrganization() {
  return authFetch('/getOrganization');
}

export async function registerOrganization(orgDetails) {
  return authFetch('/registerOrganization', {
    method: 'POST',
    body: JSON.stringify(orgDetails)
  });
}

// ═══ Product APIs ═══

export async function getOrgProducts() {
  return authFetch('/getManufacturerProducts');
}

export async function registerProduct(productData) {
  return authFetch('/registerProduct', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
}

// ═══ Batch APIs ═══

export async function registerBatch(batchData) {
  return authFetch('/registerBatch', {
    method: 'POST',
    body: JSON.stringify(batchData)
  });
}

// ═══ Audit APIs ═══

export async function getAuditLogs() {
  return authFetch('/getauditlogs');
}

export async function updateProduct(productId, productData) {
  return authFetch(`/updateProduct/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  });
}

export async function deleteProduct(productId) {
  return authFetch(`/deleteProduct/${productId}`, {
    method: 'DELETE'
  });
}

// ═══ Batch Update/Delete APIs ═══

export async function updateBatch(batchId, batchData) {
  return authFetch(`/updateBatch/${batchId}`, {
    method: 'PUT',
    body: JSON.stringify(batchData)
  });
}

export async function deleteBatch(batchId) {
  return authFetch(`/deleteSmartBatch/${batchId}`, {
    method: 'DELETE'
  });
}

// ═══ Consumer-facing (no auth required) ═══

export async function getProductByBarcode(barcode) {
  const res = await fetch(`${API_BASE}/GetProduct/${barcode}`);
  if (!res.ok) {
    let errMessage = 'Product not found';
    try {
      const error = await res.json();
      errMessage = error.error || errMessage;
    } catch(e) { errMessage = `Server error (${res.status})`; }
    throw new Error(errMessage);
  }
  return res.json();
}

export async function getBatchById(batchId) {
  const res = await fetch(`${API_BASE}/getbatch/${batchId}`);
  if (!res.ok) {
    let errMessage = 'Batch not found';
    try {
      const error = await res.json();
      errMessage = error.error || errMessage;
    } catch(e) { errMessage = `Server error (${res.status})`; }
    throw new Error(errMessage);
  }
  return res.json();
}

export async function getScanAnalytics() {
  return authFetch('/getscananalytics');
}

export async function negotiateSignalR() {
  const res = await fetch(`${API_BASE}/negotiate`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Failed to negotiate: ${res.status}`);
  }
  return res.json();
}

