import React from 'react';
import { Users, Phone, MapPin, Car, Network, Mail, Search, AlertTriangle } from 'lucide-react';
import './StatsBar.css';

interface StatsBarProps {
  entityCount: number;
  relationshipCount: number;
  suspiciousCount: number;
  typeCounts: Record<string, number>;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PERSON: <Users size={12} />,
  PHONE: <Phone size={12} />,
  LOCATION: <MapPin size={12} />,
  VEHICLE: <Car size={12} />,
  ORGANIZATION: <Network size={12} />,
  DATE: <Search size={12} />,
  MONEY: <AlertTriangle size={12} />,
  EMAIL: <Mail size={12} />,
};

const TYPE_LABELS: Record<string, string> = {
  PERSON: 'Persons',
  PHONE: 'Phones',
  LOCATION: 'Locations',
  VEHICLE: 'Vehicles',
  ORGANIZATION: 'Orgs',
  DATE: 'Dates',
  MONEY: 'Money',
  EMAIL: 'Emails',
};

const TYPE_COLORS: Record<string, string> = {
  PERSON: '#e41a1c',
  PHONE: '#377eb8',
  LOCATION: '#4daf4a',
  VEHICLE: '#984ea3',
  ORGANIZATION: '#ff7f00',
  DATE: '#ffff33',
  MONEY: '#a65628',
  EMAIL: '#f781bf',
};

const StatsBar: React.FC<StatsBarProps> = ({ 
  entityCount, 
  relationshipCount, 
  suspiciousCount,
  typeCounts 
}) => {
  return (
    <div className="stats-bar">
      <div className="stat-item primary">
        <span className="stat-value">{entityCount}</span>
        <span className="stat-label">Entities</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value">{relationshipCount}</span>
        <span className="stat-label">Relations</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item warning">
        <span className="stat-value">{suspiciousCount}</span>
        <span className="stat-label">Suspicious</span>
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <div className="type-breakdown">
          <span className="breakdown-label">By Type:</span>
          <div className="type-chips">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div 
                key={type} 
                className="type-chip"
                style={{ borderColor: TYPE_COLORS[type] }}
              >
                <span className="chip-icon" style={{ color: TYPE_COLORS[type] }}>
                  {TYPE_ICONS[type] || <Search size={10} />}
                </span>
                <span>{TYPE_LABELS[type] || type}: {count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsBar;