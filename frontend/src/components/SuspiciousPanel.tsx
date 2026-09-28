import React, { useMemo } from 'react';
import { AlertTriangle, Users, Phone, MapPin, Car, Network, Mail, Search, TrendingUp, Shield, Target } from 'lucide-react';
import './SuspiciousPanel.css';

interface Entity {
  id: string;
  text: string;
  type: string;
  confidence: number;
  metadata: Record<string, any>;
}

interface SuspiciousEntity {
  entity: Entity;
  degree_centrality: number;
  betweenness_centrality: number;
  closeness_centrality: number;
  risk_score: number;
  reasons: string[];
}

interface SuspiciousPanelProps {
  suspiciousEntities: SuspiciousEntity[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PERSON: <Users size={14} />,
  PHONE: <Phone size={14} />,
  LOCATION: <MapPin size={14} />,
  VEHICLE: <Car size={14} />,
  ORGANIZATION: <Network size={14} />,
  DATE: <Search size={14} />,
  MONEY: <AlertTriangle size={14} />,
  EMAIL: <Mail size={14} />,
};

const TYPE_LABELS: Record<string, string> = {
  PERSON: 'Person',
  PHONE: 'Phone',
  LOCATION: 'Location',
  VEHICLE: 'Vehicle',
  ORGANIZATION: 'Organization',
  DATE: 'Date',
  MONEY: 'Money',
  EMAIL: 'Email',
};

const TYPE_COLORS: Record<string, string> = {
  PERSON: '#e94560',
  PHONE: '#0ea5e9',
  LOCATION: '#22c55e',
  VEHICLE: '#a855f7',
  ORGANIZATION: '#f97316',
  DATE: '#eab308',
  MONEY: '#f43f5e',
  EMAIL: '#ec4899',
};

const getRiskLevel = (score: number) => {
  if (score >= 0.7) return { label: 'Critical', color: '#ef4444', icon: <Target size={14} /> };
  if (score >= 0.5) return { label: 'High', color: '#f97316', icon: <AlertTriangle size={14} /> };
  if (score >= 0.3) return { label: 'Medium', color: '#eab308', icon: <TrendingUp size={14} /> };
  return { label: 'Low', color: '#22c55e', icon: <Shield size={14} /> };
};

const SuspiciousPanel: React.FC<SuspiciousPanelProps> = ({ suspiciousEntities }) => {
  const sortedEntities = useMemo(() => 
    [...suspiciousEntities].sort((a, b) => b.risk_score - a.risk_score),
    [suspiciousEntities]
  );

  const riskCounts = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    sortedEntities.forEach(e => {
      const level = getRiskLevel(e.risk_score);
      counts[level.label]++;
    });
    return counts;
  }, [sortedEntities]);

  if (suspiciousEntities.length === 0) {
    return (
      <div className="suspicious-panel-empty">
        <Shield size={56} />
        <h3>No Suspicious Patterns Detected</h3>
        <p>The analysis didn't identify any entities with suspicious connection patterns.</p>
        <p className="hint">Entities with high connectivity, bridging roles, or central positions would appear here.</p>
      </div>
    );
  }

  return (
    <div className="suspicious-panel">
      <div className="panel-header">
        <div className="header-content">
          <div className="header-icon">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3>Suspicious Entities</h3>
            <p className="subtitle">{suspiciousEntities.length} entities flagged for review</p>
          </div>
        </div>
        <div className="risk-summary">
          {Object.entries(riskCounts).map(([level, count]) => (
            <div key={level} className={`risk-badge ${level.toLowerCase()}`}>
              <span className="risk-count">{count}</span>
              <span className="risk-label">{level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="suspicious-list">
        {sortedEntities.map((suspicious, index) => {
          const entity = suspicious.entity;
          const risk = getRiskLevel(suspicious.risk_score);
          const color = TYPE_COLORS[entity.type] || '#888';
          const icon = TYPE_ICONS[entity.type] || <Search size={14} />;

          return (
            <div key={entity.id} className="suspicious-card" style={{ borderLeftColor: risk.color }}>
              <div className="card-main">
                <div className="entity-header">
                  <div className="entity-icon" style={{ background: `${color}20`, borderColor: color }}>
                    {icon}
                  </div>
                  <div className="entity-info">
                    <div className="entity-name-row">
                      <span className="entity-name">{entity.text}</span>
                      <span 
                        className="entity-type-badge"
                        style={{ background: `${color}20`, color }}
                      >
                        {TYPE_LABELS[entity.type] || entity.type}
                      </span>
                    </div>
                    <div className="entity-meta">
                      <span>Confidence: {(entity.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="risk-score-container">
                    <div 
                      className="risk-score-circle"
                      style={{ 
                        background: `conic-gradient(${risk.color} ${suspicious.risk_score * 360}deg, var(--border-primary) 0deg)` 
                      }}
                    >
                      <span className="risk-score-value">
                        {(suspicious.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="risk-level" style={{ color: risk.color }}>
                      {risk.icon}
                      <span>{risk.label}</span>
                    </div>
                  </div>
                </div>

                <div className="centrality-metrics">
                  <div className="metric">
                    <span className="metric-label">Degree</span>
                    <span className="metric-value">{(suspicious.degree_centrality * 100).toFixed(1)}%</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ width: `${suspicious.degree_centrality * 100}%`, background: '#ef4444' }}
                      />
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Betweenness</span>
                    <span className="metric-value">{(suspicious.betweenness_centrality * 100).toFixed(1)}%</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ width: `${suspicious.betweenness_centrality * 100}%`, background: '#f97316' }}
                      />
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Closeness</span>
                    <span className="metric-value">{(suspicious.closeness_centrality * 100).toFixed(1)}%</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ width: `${suspicious.closeness_centrality * 100}%`, background: '#22c55e' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-reasons">
                <h5>Detection Reasons</h5>
                <ul className="reasons-list">
                  {suspicious.reasons.map((reason, i) => (
                    <li key={i} className="reason-item">
                      <AlertTriangle size={12} />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuspiciousPanel;