import { useState } from 'react';

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function ProposalForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [fields, setFields] = useState({
    clientName: initial.clientName || '',
    serviceDescription: initial.serviceDescription || '',
    proposalAmount: initial.proposalAmount || '',
    dateSent: initial.dateSent || today(),
  });
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!fields.clientName.trim()) errs.clientName = 'Required';
    if (!fields.serviceDescription.trim()) errs.serviceDescription = 'Required';
    if (!fields.proposalAmount || isNaN(Number(fields.proposalAmount)) || Number(fields.proposalAmount) <= 0)
      errs.proposalAmount = 'Enter a valid amount';
    if (!fields.dateSent) errs.dateSent = 'Required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(fields);
  }

  return (
    <form className="proposal-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="clientName">Client Name</label>
        <input
          id="clientName"
          type="text"
          value={fields.clientName}
          onChange={(e) => set('clientName', e.target.value)}
          placeholder="e.g. Acme Corp"
          className={errors.clientName ? 'input-error' : ''}
        />
        {errors.clientName && <span className="field-error">{errors.clientName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="serviceDescription">Service / Offering</label>
        <textarea
          id="serviceDescription"
          value={fields.serviceDescription}
          onChange={(e) => set('serviceDescription', e.target.value)}
          placeholder="e.g. Brand identity redesign"
          rows={3}
          className={errors.serviceDescription ? 'input-error' : ''}
        />
        {errors.serviceDescription && <span className="field-error">{errors.serviceDescription}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="proposalAmount">Amount (USD)</label>
          <input
            id="proposalAmount"
            type="number"
            min="1"
            step="1"
            value={fields.proposalAmount}
            onChange={(e) => set('proposalAmount', e.target.value)}
            placeholder="5000"
            className={errors.proposalAmount ? 'input-error' : ''}
          />
          {errors.proposalAmount && <span className="field-error">{errors.proposalAmount}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="dateSent">Date Sent</label>
          <input
            id="dateSent"
            type="date"
            value={fields.dateSent}
            onChange={(e) => set('dateSent', e.target.value)}
            className={errors.dateSent ? 'input-error' : ''}
          />
          {errors.dateSent && <span className="field-error">{errors.dateSent}</span>}
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
