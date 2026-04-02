import { useState, useEffect, useCallback } from 'react';
import { createProposal, shouldAutoArchive } from '../utils/proposals';

const STORAGE_KEY = 'followup_proposals';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(proposals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
}

export function useProposals() {
  const [proposals, setProposals] = useState(() => load());

  // Auto-archive check runs on every render cycle that touches proposals
  useEffect(() => {
    const now = new Date().toISOString();
    const updated = proposals.map((p) => {
      if (shouldAutoArchive(p) && !p.archivedAt) {
        return { ...p, archivedAt: now, updatedAt: now };
      }
      return p;
    });
    // Only trigger a save/re-render if something actually changed
    const changed = updated.some((p, i) => p.archivedAt !== proposals[i].archivedAt);
    if (changed) {
      setProposals(updated);
    } else {
      save(proposals);
    }
  }, [proposals]);

  const addProposal = useCallback((fields) => {
    const p = createProposal(fields);
    setProposals((prev) => [p, ...prev]);
  }, []);

  const updateProposal = useCallback((id, changes) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const deleteProposal = useCallback((id) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setStatus = useCallback((id, status) => {
    const now = new Date().toISOString();
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const archivedAt =
          status === 'pending' ? null : p.archivedAt; // reactivating clears archive
        return { ...p, status, archivedAt, updatedAt: now };
      })
    );
  }, []);

  const reactivate = useCallback((id) => {
    const now = new Date().toISOString();
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'pending', archivedAt: null, updatedAt: now } : p
      )
    );
  }, []);

  const activeProposals = proposals.filter((p) => p.status === 'pending' && !p.archivedAt);
  const completedProposals = proposals.filter(
    (p) => p.status !== 'pending' || p.archivedAt
  );

  return {
    proposals,
    activeProposals,
    completedProposals,
    addProposal,
    updateProposal,
    deleteProposal,
    setStatus,
    reactivate,
  };
}
