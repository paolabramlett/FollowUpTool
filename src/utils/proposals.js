import { v4 as uuidv4 } from 'uuid';

// --- Date helpers ---

export function daysElapsed(dateSent) {
  const sent = new Date(dateSent);
  const today = new Date();
  // Compare calendar dates only (no time component)
  const sentDate = new Date(sent.getFullYear(), sent.getMonth(), sent.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = todayDate - sentDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// --- Core logic ---

/**
 * Returns the active follow-up stage number (3, 7, 14),
 * "completed" if status is terminal, or null if no follow-up is due yet.
 */
export function calculateFollowUpStage(dateSent, status) {
  if (status === 'won' || status === 'lost' || status === 'no_response') {
    return 'completed';
  }
  const days = daysElapsed(dateSent);
  if (days >= 14) return 14;
  if (days >= 7) return 7;
  if (days >= 3) return 3;
  return null; // not due yet
}

/**
 * Returns next follow-up date as a Date object, or null if n/a.
 */
export function getNextFollowUpDate(dateSent, status) {
  if (status !== 'pending') return null;
  const sent = new Date(dateSent);
  const days = daysElapsed(dateSent);
  if (days < 3) {
    const d = new Date(sent);
    d.setDate(d.getDate() + 3);
    return d;
  }
  if (days < 7) {
    const d = new Date(sent);
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (days < 14) {
    const d = new Date(sent);
    d.setDate(d.getDate() + 14);
    return d;
  }
  return null; // Day 14+ — overdue or archive territory
}

export function shouldAutoArchive(proposal) {
  return daysElapsed(proposal.dateSent) >= 21 && proposal.status === 'pending';
}

const TEMPLATES = {
  3: (clientName, serviceDescription) =>
    `Hi ${clientName}, just wanted to check if you had a chance to review the ${serviceDescription} proposal. Any initial questions or thoughts? Happy to clarify anything.`,
  7: (clientName, serviceDescription) =>
    `Hi ${clientName}, I'm curious — what stood out most about the proposal? Or are there specific concerns we should address? I want to make sure this is the right fit for you.`,
  14: (clientName, serviceDescription) =>
    `Hi ${clientName}, I want to keep this moving forward. I have limited capacity this month, so I'm finalizing my schedule. Can we lock in next steps or clarify what's holding this back?`,
};

export function getMessageTemplate(stage, clientName, serviceDescription) {
  const fn = TEMPLATES[stage];
  if (!fn) return '';
  return fn(clientName, serviceDescription);
}

export function calculateWinRate(proposals) {
  const resolved = proposals.filter(
    (p) => p.status === 'won' || p.status === 'lost' || p.status === 'no_response'
  );
  const won = resolved.filter((p) => p.status === 'won').length;
  const total = resolved.length;
  return {
    won,
    total,
    percentage: total > 0 ? Math.round((won / total) * 100) : 0,
  };
}

export function getStageLabel(stage) {
  if (stage === null) return 'Awaiting Day 3';
  if (stage === 'completed') return 'Completed';
  return `Day ${stage} Follow-up`;
}

export function createProposal({ clientName, serviceDescription, proposalAmount, dateSent }) {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    clientName: clientName.trim(),
    serviceDescription: serviceDescription.trim(),
    proposalAmount: Number(proposalAmount),
    dateSent,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(proposal) {
  if (proposal.status !== 'pending') return false;
  const days = daysElapsed(proposal.dateSent);
  // Overdue if a follow-up stage is past due and not yet at auto-archive
  return days >= 3 && days < 21;
}

export function isDueToday(proposal) {
  if (proposal.status !== 'pending') return false;
  const days = daysElapsed(proposal.dateSent);
  return days === 3 || days === 7 || days === 14;
}
