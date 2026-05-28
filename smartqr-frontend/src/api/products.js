import { auth } from '../config/firebase';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:7071/api'
  : 'https://smartqr-api-rahul-f8hpaqeudbdeesa5.centralindia-01.azurewebsites.net/api';

// Helper to get token
async function getAccessToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently authenticated.');
  }

  try {
    // forceRefresh is false by default, it will only refresh if expired
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Failed to acquire Firebase token.', error);
    throw new Error('Session error. Please log in again.');
  }
}

export async function getProductByBarcode(barcode) {
  // Anonymous endpoint, no token needed
  const response = await fetch(`${API_BASE}/getproduct/${barcode}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Product not found');
  }
  return response.json();
}

export async function addProduct(data) {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/addproduct`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add product');
  }
  return response.json();
}

export async function addBatch(data) {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/addbatch`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add batch');
  }
  return response.json();
}

export async function deleteBatch(barcode, batchId) {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/deletebatch/${barcode}/${batchId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete batch');
  }
  return response.json();
}

export async function getAuditLogs() {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/getauditlogs`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch audit logs');
  }
  return response.json();
}
