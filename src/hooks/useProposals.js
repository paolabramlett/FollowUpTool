import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as api from '../lib/proposalsApi';
import { createProposal, shouldAutoArchive } from '../utils/proposals';

const CACHE_KEY = 'followup_proposals_cache';

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(proposals) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(proposals));
  } catch {
    // storage quota exceeded — ignore
  }
}

// 'idle' | 'loading' | 'synced' | 'offline' | 'error'
export function useProposals() {
  const [proposals, setProposals] = useState(() => loadCache() ?? []);
  const [syncStatus, setSyncStatus] = useState('idle');
  const online = !!supabase;

  // ── Initial load ────────────────────────────────────────
  useEffect(() => {
    if (!online) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('loading');
    api.fetchAll()
      .then((remote) => {
        setProposals(remote);
        saveCache(remote);
        setSyncStatus('synced');
      })
      .catch(() => {
        // Fall back to cache silently
        setSyncStatus('offline');
      });
  }, [online]);

  // ── Auto-archive (runs locally, then syncs) ─────────────
  useEffect(() => {
    const now = new Date().toISOString();
    const toArchive = proposals.filter((p) => shouldAutoArchive(p) && !p.archivedAt);
    if (toArchive.length === 0) return;

    const updated = proposals.map((p) => {
      if (shouldAutoArchive(p) && !p.archivedAt) {
        return { ...p, archivedAt: now, updatedAt: now };
      }
      return p;
    });

    setProposals(updated);
    saveCache(updated);

    if (online) {
      toArchive.forEach((p) => {
        api.updateProposal(p.id, { archivedAt: now, updatedAt: now }).catch(console.error);
      });
    }
  }, [proposals, online]);

  // ── Helpers ─────────────────────────────────────────────
  function applyOptimistic(newList) {
    setProposals(newList);
    saveCache(newList);
  }

  // ── Mutations ────────────────────────────────────────────

  const addProposal = useCallback(async (fields) => {
    const p = createProposal(fields);
    const optimistic = [p, ...proposals];
    applyOptimistic(optimistic);

    if (!online) return;
    try {
      const saved = await api.upsertProposal(p);
      setProposals((prev) => {
        const next = prev.map((x) => (x.id === saved.id ? saved : x));
        saveCache(next);
        return next;
      });
    } catch (err) {
      console.error('Supabase add failed:', err);
      setSyncStatus('error');
    }
  }, [proposals, online]);

  const updateProposal = useCallback(async (id, changes) => {
    const now = new Date().toISOString();
    const merged = { ...changes, updatedAt: now };
    const optimistic = proposals.map((p) => (p.id === id ? { ...p, ...merged } : p));
    applyOptimistic(optimistic);

    if (!online) return;
    try {
      await api.updateProposal(id, merged);
    } catch (err) {
      console.error('Supabase update failed:', err);
      setSyncStatus('error');
    }
  }, [proposals, online]);

  const deleteProposal = useCallback(async (id) => {
    const optimistic = proposals.filter((p) => p.id !== id);
    applyOptimistic(optimistic);

    if (!online) return;
    try {
      await api.deleteProposal(id);
    } catch (err) {
      console.error('Supabase delete failed:', err);
      setSyncStatus('error');
    }
  }, [proposals, online]);

  const setStatus = useCallback(async (id, status) => {
    const now = new Date().toISOString();
    const changes = { status, updatedAt: now, archivedAt: status === 'pending' ? null : undefined };
    const optimistic = proposals.map((p) => {
      if (p.id !== id) return p;
      return { ...p, status, updatedAt: now, archivedAt: status === 'pending' ? null : p.archivedAt };
    });
    applyOptimistic(optimistic);

    if (!online) return;
    try {
      await api.updateProposal(id, changes);
    } catch (err) {
      console.error('Supabase setStatus failed:', err);
      setSyncStatus('error');
    }
  }, [proposals, online]);

  const reactivate = useCallback(async (id) => {
    const now = new Date().toISOString();
    const optimistic = proposals.map((p) =>
      p.id === id ? { ...p, status: 'pending', archivedAt: null, updatedAt: now } : p
    );
    applyOptimistic(optimistic);

    if (!online) return;
    try {
      await api.updateProposal(id, { status: 'pending', archivedAt: null, updatedAt: now });
    } catch (err) {
      console.error('Supabase reactivate failed:', err);
      setSyncStatus('error');
    }
  }, [proposals, online]);

  const activeProposals = proposals.filter((p) => p.status === 'pending' && !p.archivedAt);
  const completedProposals = proposals.filter((p) => p.status !== 'pending' || p.archivedAt);

  return {
    proposals,
    activeProposals,
    completedProposals,
    syncStatus,
    addProposal,
    updateProposal,
    deleteProposal,
    setStatus,
    reactivate,
  };
}
