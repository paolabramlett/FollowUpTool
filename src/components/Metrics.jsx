import { calculateWinRate, calculateFollowUpStage, daysElapsed } from '../utils/proposals';

function StatCard({ label, value, subtext, accent }) {
  return (
    <div className={`stat-card ${accent ? `stat-card--${accent}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}

export default function Metrics({ proposals }) {
  const { won, total, percentage } = calculateWinRate(proposals);
  const active = proposals.filter((p) => p.status === 'pending' && !p.archivedAt);
  const archived = proposals.filter((p) => p.archivedAt && p.status === 'pending');
  const completed = proposals.filter(
    (p) => p.status === 'won' || p.status === 'lost' || p.status === 'no_response'
  );

  // Stage breakdown for active proposals
  const stageBreakdown = { null: 0, 3: 0, 7: 0, 14: 0 };
  active.forEach((p) => {
    const s = calculateFollowUpStage(p.dateSent, p.status);
    const key = s === null ? 'null' : s;
    if (key in stageBreakdown) stageBreakdown[key]++;
  });

  const winRateAccent = percentage >= 60 ? 'green' : percentage >= 40 ? 'yellow' : 'red';

  // Monthly breakdown — last 3 months
  const months = buildMonthlyBreakdown(proposals);

  return (
    <div className="metrics-container">
      <h2 className="section-title">Win Rate & Overview</h2>

      <div className="stat-grid">
        <StatCard
          label="Total Proposals"
          value={proposals.length}
          subtext="All time"
        />
        <StatCard
          label="Win Rate"
          value={`${percentage}%`}
          subtext={`${won} won / ${total} resolved`}
          accent={winRateAccent}
        />
        <StatCard
          label="Active"
          value={active.length}
          subtext="Pending follow-up"
        />
        <StatCard
          label="Completed"
          value={completed.length}
          subtext={`${proposals.filter((p) => p.status === 'lost').length} lost · ${proposals.filter((p) => p.status === 'no_response').length} no response`}
        />
      </div>

      <div className="metrics-section">
        <h3 className="metrics-section-title">Active Proposals by Stage</h3>
        <div className="stage-breakdown">
          <StageBar label="Awaiting Day 3" count={stageBreakdown['null']} total={active.length} />
          <StageBar label="Day 3 Due" count={stageBreakdown[3]} total={active.length} color="var(--orange)" />
          <StageBar label="Day 7 Due" count={stageBreakdown[7]} total={active.length} color="var(--orange)" />
          <StageBar label="Day 14 Due" count={stageBreakdown[14]} total={active.length} color="var(--red)" />
        </div>
      </div>

      {months.length > 0 && (
        <div className="metrics-section">
          <h3 className="metrics-section-title">Monthly Win Rate</h3>
          <div className="monthly-table">
            <div className="monthly-row monthly-row--header">
              <span>Month</span>
              <span>Sent</span>
              <span>Won</span>
              <span>Win Rate</span>
            </div>
            {months.map((m) => (
              <div key={m.label} className="monthly-row">
                <span>{m.label}</span>
                <span>{m.total}</span>
                <span>{m.won}</span>
                <span className={m.pct >= 60 ? 'text-green' : m.pct >= 40 ? 'text-yellow' : 'text-red'}>
                  {m.total > 0 ? `${m.pct}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {archived.length > 0 && (
        <p className="metrics-note">
          {archived.length} proposal{archived.length !== 1 ? 's' : ''} auto-archived (no response after 21 days).
        </p>
      )}

      <div className="metrics-section">
        <h3 className="metrics-section-title">Validation Goal</h3>
        <div className="goal-bar-wrapper">
          <div className="goal-bar-track">
            <div
              className="goal-bar-fill"
              style={{ width: `${Math.min(percentage, 100)}%`, background: percentage >= 60 ? 'var(--green)' : 'var(--accent)' }}
            />
            <div className="goal-bar-target" style={{ left: '60%' }} title="Target: 60%" />
          </div>
          <div className="goal-bar-labels">
            <span>0%</span>
            <span className="goal-target-label">60% target</span>
            <span>100%</span>
          </div>
        </div>
        <p className="goal-note">
          {percentage >= 60
            ? `You've hit the 60% target. Keep it up!`
            : `${60 - percentage} percentage points to reach the 60% win rate goal.`}
        </p>
      </div>
    </div>
  );
}

function StageBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="stage-bar-row">
      <span className="stage-bar-label">{label}</span>
      <div className="stage-bar-track">
        <div
          className="stage-bar-fill"
          style={{ width: `${pct}%`, background: color || 'var(--accent)' }}
        />
      </div>
      <span className="stage-bar-count">{count}</span>
    </div>
  );
}

function buildMonthlyBreakdown(proposals) {
  // Group resolved proposals by month of dateSent
  const resolved = proposals.filter(
    (p) => p.status === 'won' || p.status === 'lost' || p.status === 'no_response'
  );
  if (resolved.length === 0) return [];

  const map = {};
  resolved.forEach((p) => {
    const d = new Date(p.dateSent);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { won: 0, total: 0 };
    map[key].total++;
    if (p.status === 'won') map[key].won++;
  });

  return Object.entries(map)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([key, val]) => {
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      return { label, won: val.won, total: val.total, pct: Math.round((val.won / val.total) * 100) };
    });
}
