import { supabase } from './supabase';

// ── Column name mapping ───────────────────────────────────
// DB uses snake_case; the app uses camelCase.

function toRow(p) {
  return {
    id: p.id,
    client_name: p.clientName,
    service_description: p.serviceDescription,
    proposal_amount: p.proposalAmount,
    date_sent: p.dateSent,
    status: p.status,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    archived_at: p.archivedAt ?? null,
  };
}

function fromRow(r) {
  return {
    id: r.id,
    clientName: r.client_name,
    serviceDescription: r.service_description,
    proposalAmount: Number(r.proposal_amount),
    dateSent: r.date_sent,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    archivedAt: r.archived_at ?? null,
  };
}

// ── API calls ─────────────────────────────────────────────

export async function fetchAll() {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function upsertProposal(proposal) {
  const { data, error } = await supabase
    .from('proposals')
    .upsert(toRow(proposal), { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateProposal(id, changes) {
  const row = {};
  if ('clientName' in changes)         row.client_name = changes.clientName;
  if ('serviceDescription' in changes)  row.service_description = changes.serviceDescription;
  if ('proposalAmount' in changes)      row.proposal_amount = changes.proposalAmount;
  if ('dateSent' in changes)            row.date_sent = changes.dateSent;
  if ('status' in changes)              row.status = changes.status;
  if ('archivedAt' in changes)          row.archived_at = changes.archivedAt ?? null;
  row.updated_at = changes.updatedAt ?? new Date().toISOString();

  const { data, error } = await supabase
    .from('proposals')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteProposal(id) {
  const { error } = await supabase.from('proposals').delete().eq('id', id);
  if (error) throw error;
}
