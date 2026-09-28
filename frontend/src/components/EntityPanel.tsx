import React, { useState, useMemo } from 'react';
import { Users, Phone, MapPin, Car, Network, Search, AlertTriangle, Mail, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import './EntityPanel.css';

interface Entity {
  id: string;
  text: string;
  type: string;
  confidence: number;
  start_char: number;
  end_char: number;
  source_document_id: string;
  metadata: Record<string, any>;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  weight: number;
  confidence: number;
  evidence: string[];
  metadata: Record<string, any>;
}

interface EntityPanelProps {
  entities: Entity[];
  relationships: Relationship[];
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
  PERSON: '#e41a1c',
  PHONE: '#377eb8',
  LOCATION: '#4daf4a',
  VEHICLE: '#984ea3',
  ORGANIZATION: '#ff7f00',
  DATE: '#ffff33',
  MONEY: '#a65628',
  EMAIL: '#f781bf',
};

const EntityPanel: React.FC<EntityPanelProps> = ({ entities, relationships }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const types = useMemo(() => [...new Set(entities.map(e => e.type))], [entities]);

  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      const matchesSearch = entity.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || entity.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [entities, searchTerm, selectedType]);

  const getConnections = (entityId: string) => {
    return relationships.filter(r => r.source_id === entityId || r.target_id === entityId);
  };

  const getConnectedEntities = (entityId: string) => {
    const connections = getConnections(entityId);
    const connectedIds = new Set<string>();
    connections.forEach(r => {
      if (r.source_id !== entityId) connectedIds.add(r.source_id);
      if (r.target_id !== entityId) connectedIds.add(r.target_id);
    });
    return entities.filter(e => connectedIds.has(e.id));
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const isExpanded = (id: string) => expandedIds.has(id);

  if (entities.length === 0) {
    return (
      <div className="entity-panel-empty">
        <Search size={48} />
        <p>No entities extracted</p>
      </div>
    );
  }

  return (
    <div className="entity-panel">
      <div className="panel-header">
        <h3>Extracted Entities</h3>
        <span className="entity-count">{filteredEntities.length} / {entities.length}</span>
      </div>

      <div className="panel-filters">
        <div className="search-box">
          <Filter size={16} />
          <input
            type="text"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedType} 
          onChange={(e) => setSelectedType(e.target.value)}
          className="type-filter"
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>
              {TYPE_LABELS[type] || type}
            </option>
          ))}
        </select>
      </div>

      <div className="entity-list">
        {filteredEntities.map(entity => {
          const connections = getConnections(entity.id);
          const connectedEntities = getConnectedEntities(entity.id);
          const expanded = isExpanded(entity.id);
          const icon = TYPE_ICONS[entity.type] || <Search size={14} />;
          const color = TYPE_COLORS[entity.type] || '#888';

          return (
            <div key={entity.id} className="entity-card">
              <div 
                className="entity-header"
                onClick={() => toggleExpand(entity.id)}
              >
                <div className="entity-icon" style={{ borderColor: color }}>
                  {icon}
                </div>
                <div className="entity-info">
                  <div className="entity-name-row">
                    <span className="entity-name" title={entity.text}>{entity.text}</span>
                    <span 
                      className="entity-type-badge"
                      style={{ background: color + '20', color }}
                    >
                      {TYPE_LABELS[entity.type] || entity.type}
                    </span>
                  </div>
                  <div className="entity-meta">
                    <span>Confidence: {(entity.confidence * 100).toFixed(0)}%</span>
                    <span>Connections: {connections.length}</span>
                  </div>
                </div>
                <div className="entity-expand">
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expanded && (
                <div className="entity-details">
                  <div className="detail-section">
                    <h5>Connections ({connections.length})</h5>
                    {connections.length === 0 ? (
                      <p className="no-connections">No direct connections</p>
                    ) : (
                      <ul className="connections-list">
                        {connections.map(conn => {
                          const otherId = conn.source_id === entity.id ? conn.target_id : conn.source_id;
                          const otherEntity = entities.find(e => e.id === otherId);
                          const otherIcon = otherEntity ? TYPE_ICONS[otherEntity.type] : <Search size={12} />;
                          const otherColor = otherEntity ? TYPE_COLORS[otherEntity.type] : '#888';
                          return (
                            <li key={conn.id} className="connection-item">
                              <div className="connection-type" style={{ color: otherColor }}>
                                {otherIcon}
                                <span>{conn.type.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="connection-target" title={otherEntity?.text}>
                                {otherEntity?.text || 'Unknown'}
                              </div>
                              <div className="connection-weight">
                                Weight: {conn.weight.toFixed(2)}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {connectedEntities.length > 0 && (
                    <div className="detail-section">
                      <h5>Connected Entities ({connectedEntities.length})</h5>
                      <div className="connected-entities">
                        {connectedEntities.map(e => (
                          <div 
                            key={e.id} 
                            className="connected-entity-tag"
                            style={{ borderColor: TYPE_COLORS[e.type] }}
                          >
                            <span className="tag-icon" style={{ color: TYPE_COLORS[e.type] }}>
                              {TYPE_ICONS[e.type] || <Search size={10} />}
                            </span>
                            {e.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <h5>Metadata</h5>
                    <pre className="metadata-display">
                      {JSON.stringify(entity.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredEntities.length === 0 && (
        <div className="no-results">
          <Search size={32} />
          <p>No entities match your filters</p>
        </div>
      )}
    </div>
  );
};

export default EntityPanel;