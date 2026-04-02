import { useState } from 'react';
import {
  calculateFollowUpStage,
  getNextFollowUpDate,
  daysElapsed,
  formatCurrency,
  formatDate,
  getStageLabel,
  isDueToday,
  isOverdue,
} from '../utils/proposals';
import MessageModal from './MessageModal';
import ProposalForm from './ProposalForm';

const STATUS_OPTIONS = [
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'no_response', label: 'No Response' },
];

export default function ActiveProposals({ proposals, onSetStatus, onUpdate, onDelete }) {
  const [messageProposal, setMessageProposal] = useState(null);
  const [editProposal, setEditProposal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Sort: overdue first, then by days elapsed desc
  const sorted = [...proposals].sort((a, b) => {
    const aOver = isOverdue(a) ? 1 : 0;
    const bOver = isOverdue(b) ? 1 : 0;
    if (bOver !== aOver) return bOver - aOver;
    return daysElapsed(b.dateSent) - daysElapsed(a.dateSent);
  });

  function handleEdit(proposal) {
    setEditProposal(proposal);
  }

  function handleUpdate(fields) {
    onUpdate(editProposal.id, fields);
    setEditProposal(null);
  }

  function handleDeleteConfirm(id) {
    onDelete(id);
    setDeleteConfirm(null);
  }

  function rowClass(p) {
    if (isDueToday(p)) return 'row-due-today';
    if (isOverdue(p)) return 'row-overdue';
    return '';
  }

  function stageIndicator(p) {
    const stage = calculateFollowUpStage(p.dateSent, p.status);
    const days = daysElapsed(p.dateSent);
    if (stage === null) {
      const next = getNextFollowUpDate(p.dateSent, p.status);
      return (
        <span className="stage-badge stage-upcoming">
          Follow-up {next ? `on ${formatDate(next)}` : 'N/A'}
        </span>
      );
    }
    if (isDueToday(p)) {
      return <span className="stage-badge stage-today">Day {stage} — Due Today</span>;
    }
    return <span className="stage-badge stage-overdue">Day {stage} — Overdue</span>;
  }

  if (proposals.length === 0) {
    return (
      <div className="empty-state">
        <p>No active proposals. Create one to start tracking.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrapper">
        <table className="proposals-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Days Out</th>
              <th>Follow-up</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className={rowClass(p)}>
                <td className="td-client">{p.clientName}</td>
                <td className="td-service">{p.serviceDescription}</td>
                <td className="td-amount">{formatCurrency(p.proposalAmount)}</td>
                <td className="td-days">{daysElapsed(p.dateSent)}d</td>
                <td>{stageIndicator(p)}</td>
                <td>
                  <div className="action-row">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setMessageProposal(p)}
                    >
                      Message
                    </button>

                    <select
                      className="status-select"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) onSetStatus(p.id, e.target.value);
                        e.target.value = '';
                      }}
                      title="Mark outcome"
                    >
                      <option value="" disabled>Mark as…</option>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>

                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => setDeleteConfirm(p)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {messageProposal && (
        <MessageModal
          proposal={messageProposal}
          onClose={() => setMessageProposal(null)}
        />
      )}

      {editProposal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditProposal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit Proposal</h2>
              <button className="modal-close" onClick={() => setEditProposal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <ProposalForm
                initial={editProposal}
                onSubmit={handleUpdate}
                onCancel={() => setEditProposal(null)}
                submitLabel="Save Changes"
              />
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal modal--sm">
            <div className="modal-header">
              <h2 className="modal-title">Delete Proposal?</h2>
            </div>
            <div className="modal-body">
              <p>
                Delete the proposal for <strong>{deleteConfirm.clientName}</strong>?
                This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteConfirm(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
