import { useState } from 'react';
import { formatCurrency, formatDate, daysElapsed } from '../utils/proposals';

const STATUS_LABELS = {
  won: 'Won',
  lost: 'Lost',
  no_response: 'No Response',
  pending: 'Archived',
};

const FILTERS = ['all', 'won', 'lost', 'no_response', 'archived'];
const FILTER_LABELS = {
  all: 'All',
  won: 'Won',
  lost: 'Lost',
  no_response: 'No Response',
  archived: 'Archived',
};

export default function CompletedArchived({ proposals, onSetStatus, onReactivate }) {
  const [filter, setFilter] = useState('all');

  const filtered = proposals.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'archived') return p.archivedAt && p.status === 'pending';
    return p.status === filter;
  });

  // Sort: won first, then by updated date desc
  const sorted = [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  function statusBadge(p) {
    const label = p.archivedAt && p.status === 'pending' ? 'Archived' : STATUS_LABELS[p.status];
    const cls = {
      Won: 'badge-won',
      Lost: 'badge-lost',
      'No Response': 'badge-no-response',
      Archived: 'badge-archived',
    }[label] || '';
    return <span className={`status-badge ${cls}`}>{label}</span>;
  }

  if (proposals.length === 0) {
    return (
      <div className="empty-state">
        <p>No completed or archived proposals yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No proposals match this filter.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="proposals-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Sent</th>
                <th>Days Out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td className="td-client">{p.clientName}</td>
                  <td className="td-service">{p.serviceDescription}</td>
                  <td className="td-amount">{formatCurrency(p.proposalAmount)}</td>
                  <td>{formatDate(p.dateSent)}</td>
                  <td className="td-days">{daysElapsed(p.dateSent)}d</td>
                  <td>{statusBadge(p)}</td>
                  <td>
                    <div className="action-row">
                      {p.archivedAt && p.status === 'pending' ? (
                        <>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => onReactivate(p.id)}
                          >
                            Reactivate
                          </button>
                          <select
                            className="status-select"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) onSetStatus(p.id, e.target.value);
                              e.target.value = '';
                            }}
                          >
                            <option value="" disabled>Mark as…</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                            <option value="no_response">No Response</option>
                          </select>
                        </>
                      ) : (
                        <select
                          className="status-select"
                          value={p.status}
                          onChange={(e) => onSetStatus(p.id, e.target.value)}
                        >
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                          <option value="no_response">No Response</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
