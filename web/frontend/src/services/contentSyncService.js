/**
 * Content Synchronization Service
 * 
 * Implements Offline-First Synchronization Architecture:
 * 1. Checks content version against backend API.
 * 2. Downloads only changed/new language assets.
 * 3. Updates local IndexedDB without blocking user.
 * 4. Dispatches reactive events so UI refreshes automatically.
 * 5. Handles seamless online / offline transitions.
 */

import { idbService } from './db/indexedDbService.js';

const API_BASE = 'http://localhost:5000/api/v1';

class ContentSyncService {
  constructor() {
    this.isSyncing = false;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.lastSyncVersion = null;
    this.lastSyncTime = null;
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.syncWithBackend(); // Auto-sync when internet is restored
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      try { listener(state); } catch {}
    }
  }

  getState() {
    return {
      isSyncing: this.isSyncing,
      isOnline: this.isOnline,
      lastSyncVersion: this.lastSyncVersion,
      lastSyncTime: this.lastSyncTime
    };
  }

  async initSync() {
    try {
      this.lastSyncVersion = await idbService.getMeta('lastSyncVersion');
      this.lastSyncTime = await idbService.getMeta('lastSyncTime');
      this.notify();

      if (this.isOnline) {
        // Trigger non-blocking background sync
        this.syncWithBackend().catch(err => {
          console.warn('[Sync] Background sync notice:', err.message);
        });
      }
    } catch (e) {
      console.error('[Sync] Init error:', e);
    }
  }

  async syncWithBackend(force = false) {
    if (!this.isOnline) {
      return { success: false, offline: true, message: 'Offline mode — showing saved content.' };
    }

    if (this.isSyncing) return { inProgress: true };

    this.isSyncing = true;
    this.notify();

    try {
      let localVocabCount = 0;
      try {
        localVocabCount = await idbService.getVocabularyCount();
      } catch (cntErr) {
        console.warn('[Sync] Count check skipped:', cntErr);
      }

      const shouldForce = force || localVocabCount === 0 || !this.lastSyncVersion;
      const queryStr = shouldForce
        ? '?force=true'
        : `?since=${encodeURIComponent(this.lastSyncVersion)}`;

      const response = await fetch(`${API_BASE}/content/sync${queryStr}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Sync server responded with ${response.status}`);
      }

      const result = await response.json();

      if (result.upToDate) {
        this.lastSyncTime = Date.now();
        await idbService.setMeta('lastSyncTime', this.lastSyncTime);
        this.isSyncing = false;
        this.notify();
        return { success: true, upToDate: true, version: result.version };
      }

      // Process Categories
      if (result.categories) {
        const catToAddOrUpdate = [...(result.categories.added || []), ...(result.categories.updated || [])];
        if (catToAddOrUpdate.length > 0) {
          await idbService.putCategoriesList(catToAddOrUpdate);
        }
        if (result.categories.deleted?.length > 0) {
          await idbService.deleteCategoriesByIds(result.categories.deleted);
        }
      }

      // Process Vocabulary
      if (result.vocabulary) {
        const vocabToAddOrUpdate = [...(result.vocabulary.added || []), ...(result.vocabulary.updated || [])];
        if (vocabToAddOrUpdate.length > 0) {
          await idbService.putVocabularyList(vocabToAddOrUpdate);
        }
        if (result.vocabulary.deleted?.length > 0) {
          await idbService.deleteVocabularyByIds(result.vocabulary.deleted);
        }
      }

      // Process Phrases
      if (result.phrases) {
        const phrasesToAddOrUpdate = [...(result.phrases.added || []), ...(result.phrases.updated || [])];
        if (phrasesToAddOrUpdate.length > 0) {
          await idbService.putPhrasesList(phrasesToAddOrUpdate);
        }
        if (result.phrases.deleted?.length > 0) {
          await idbService.deletePhrasesByIds(result.phrases.deleted);
        }
      }

      // Update Sync Metadata
      this.lastSyncVersion = result.version;
      this.lastSyncTime = Date.now();
      await idbService.setMeta('lastSyncVersion', result.version);
      await idbService.setMeta('lastSyncTime', this.lastSyncTime);

      // Dispatch custom browser event for components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ha_content_synced', {
          detail: { version: result.version, timestamp: this.lastSyncTime }
        }));
      }

      this.isSyncing = false;
      this.notify();

      return {
        success: true,
        updated: true,
        version: result.version
      };
    } catch (err) {
      console.warn('[Sync] Sync failed, keeping offline cached content:', err.message);
      this.isSyncing = false;
      this.notify();
      return { success: false, error: err.message };
    }
  }
}

export const contentSyncService = new ContentSyncService();
