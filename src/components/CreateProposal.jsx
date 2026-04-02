import ProposalForm from './ProposalForm';

export default function CreateProposal({ onCreate }) {
  return (
    <div className="create-container">
      <h2 className="section-title">New Proposal</h2>
      <p className="section-subtitle">
        Add a proposal you've sent to start tracking follow-ups automatically.
      </p>
      <ProposalForm onSubmit={onCreate} submitLabel="Create Proposal" />
    </div>
  );
}
