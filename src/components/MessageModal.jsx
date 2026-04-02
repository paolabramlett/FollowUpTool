import { useState } from 'react';
import {
  calculateFollowUpStage,
  getMessageTemplate,
  getStageLabel,
} from '../utils/proposals';

export default function MessageModal({ proposal, onClose }) {
  const stage = calculateFollowUpStage(proposal.dateSent, proposal.status);
  const defaultMessage = stage && stage !== 'completed'
    ? getMessageTemplate(stage, proposal.clientName, proposal.serviceDescription)
    : '';

  const [message, setMessage] = useState(defaultMessage);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{getStageLabel(stage)}</h2>
            <p className="modal-subtitle">
              {proposal.clientName} &mdash; {proposal.serviceDescription}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {stage === 'completed' ? (
            <p className="modal-no-message">
              This proposal is completed — no more follow-ups needed.
            </p>
          ) : stage === null ? (
            <p className="modal-no-message">
              No follow-up due yet. Check back on Day 3.
            </p>
          ) : editing ? (
            <textarea
              className="message-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          ) : (
            <div className="message-box">{message}</div>
          )}
        </div>

        <div className="modal-footer">
          {stage && stage !== 'completed' && (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? 'Done Editing' : 'Edit'}
              </button>
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
