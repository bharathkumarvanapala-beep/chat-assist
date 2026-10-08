/**
 * Webmaster / Admin API Service
 * 
 * Provides administrative controls for modifying official language content:
 * - Vocabulary management
 * - Phrasebook management
 * - Category management
 * - Bulk CSV/JSON import
 */

import { contentSyncService } from './contentSyncService.js';

const API_BASE = 'http://localhost:5000/api/v1';
const ADMIN_STORAGE_KEY = 'ha_admin_passkey_v1';

class AdminApiService {
  getAdminKey() {
    try {
      return sessionStorage.getItem(ADMIN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  setAdminKey(key) {
    try {
      sessionStorage.setItem(ADMIN_STORAGE_KEY, key);
    } catch {}
  }

  clearAdminKey() {
    try {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {}
  }

  getHeaders() {
    const key = this.getAdminKey();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-admin-key': key
    };
  }

  async verifyAdminKey(key) {
    const candidate = key || this.getAdminKey();
    const res = await fetch(`${API_BASE}/content/admin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': candidate
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid administrator key.');
    }

    if (key) this.setAdminKey(key);
    return true;
  }

  // ==========================================
  // VOCABULARY CRUD
  // ==========================================

  async createVocabulary(data) {
    const res = await fetch(`${API_BASE}/vocabulary`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create vocabulary word.');
    await contentSyncService.syncWithBackend(true);
    return result.data;
  }

  async updateVocabulary(id, data) {
    const res = await fetch(`${API_BASE}/vocabulary/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update vocabulary word.');
    await contentSyncService.syncWithBackend(true);
    return result.data;
  }

  async deleteVocabulary(id, hard = false) {
    const res = await fetch(`${API_BASE}/vocabulary/${encodeURIComponent(id)}?hard=${hard}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete vocabulary word.');
    await contentSyncService.syncWithBackend(true);
    return result;
  }

  // ==========================================
  // PHRASEBOOK CRUD
  // ==========================================

  async createPhrase(data) {
    const res = await fetch(`${API_BASE}/phrases`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create phrase.');
    await contentSyncService.syncWithBackend(true);
    return result.data;
  }

  async updatePhrase(id, data) {
    const res = await fetch(`${API_BASE}/phrases/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update phrase.');
    await contentSyncService.syncWithBackend(true);
    return result.data;
  }

  async deletePhrase(id, hard = false) {
    const res = await fetch(`${API_BASE}/phrases/${encodeURIComponent(id)}?hard=${hard}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete phrase.');
    await contentSyncService.syncWithBackend(true);
    return result;
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  async createCategory(data) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create category.');
    await contentSyncService.syncWithBackend(true);
    return result.data;
  }

  async updateCategory(id, data) {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update category.');
    await contentSyncService.syncWithBackend(true);
    return result.data;
  }

  async deleteCategory(id, hard = false) {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}?hard=${hard}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete category.');
    await contentSyncService.syncWithBackend(true);
    return result;
  }

  // ==========================================
  // BULK IMPORT
  // ==========================================

  async bulkImport(type, payload) {
    const res = await fetch(`${API_BASE}/content/admin/import`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ type, ...payload })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Bulk import failed.');
    await contentSyncService.syncWithBackend(true);
    return result;
  }
}

export const adminApiService = new AdminApiService();
