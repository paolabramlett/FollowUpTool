import { useState } from 'react';
import { useProposals } from './hooks/useProposals';
import ActiveProposals from './components/ActiveProposals';
import CompletedArchived from './components/CompletedArchived';
import Metrics from './components/Metrics';
import CreateProposal from './components/CreateProposal';
import './App.css';

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed & Archived' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'create', label: '+ New Proposal' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('active');
  const store = useProposals();

  function handleCreate(fields) {
    store.addProposal(fields);
    setActiveTab('active');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Proposal Tracker</h1>
        <p className="app-subtitle">Follow up. Win more.</p>
      </header>

      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'active' && store.activeProposals.length > 0 && (
              <span className="tab-badge">{store.activeProposals.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'active' && (
          <ActiveProposals
            proposals={store.activeProposals}
            onSetStatus={store.setStatus}
            onUpdate={store.updateProposal}
            onDelete={store.deleteProposal}
          />
        )}
        {activeTab === 'completed' && (
          <CompletedArchived
            proposals={store.completedProposals}
            onSetStatus={store.setStatus}
            onReactivate={store.reactivate}
          />
        )}
        {activeTab === 'metrics' && (
          <Metrics proposals={store.proposals} />
        )}
        {activeTab === 'create' && (
          <CreateProposal onCreate={handleCreate} />
        )}
      </main>
    </div>
  );
}
