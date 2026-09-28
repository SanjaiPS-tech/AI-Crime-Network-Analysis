import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, Search, AlertTriangle, 
  Network, Users, Phone, MapPin, Car, Mail,
  ChevronDown, ChevronUp, RefreshCw, Trash2,
  Download, Eye, EyeOff
} from 'lucide-react';
import NetworkGraph from './components/NetworkGraph';
import EntityPanel from './components/EntityPanel';
import SuspiciousPanel from './components/SuspiciousPanel';
import UploadPanel from './components/UploadPanel';
import StatsBar from './components/StatsBar';
import './App.css';

interface Document {
  id: string;
  filename: string;
  uploaded_at: string;
  metadata: Record<string, any>;
}

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

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
  metadata: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  color: string;
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

interface AnalysisResult {
  document_id: string;
  entities: Entity[];
  relationships: Relationship[];
  graph: GraphData;
  suspicious_entities: SuspiciousEntity[];
  processed_at: string;
  metadata: Record<string, any>;
}

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

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showEntities, setShowEntities] = useState(true);
  const [showSuspicious, setShowSuspicious] = useState(true);
  const [activeTab, setActiveTab] = useState<'network' | 'entities' | 'suspicious'>('network');

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/v1/documents');
      const data = await res.json();
      setDocuments(data);
      if (data.length > 0 && !selectedDocId) {
        setSelectedDocId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleDocumentSelect = async (docId: string) => {
    setSelectedDocId(docId);
    setResult(null);
    try {
      const res = await fetch(`/api/v1/result/${docId}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Failed to load result:', err);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        await loadDocuments();
        setSelectedDocId(data.document_id);
      } else {
        alert(data.detail || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    }
  };

  const handleProcess = async (docId: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/v1/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, use_transformers: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
      } else {
        alert(data.detail || 'Processing failed');
      }
    } catch (err) {
      console.error('Processing failed:', err);
      alert('Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (docId: string) => {
    // Note: DELETE endpoint not implemented yet, just remove from UI
    setDocuments(documents.filter(d => d.id !== docId));
    if (selectedDocId === docId) {
      setSelectedDocId(documents.find(d => d.id !== docId)?.id || null);
      setResult(null);
    }
  };

  const getTypeCounts = () => {
    if (!result) return {};
    const counts: Record<string, number> = {};
    result.entities.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Network className="header-icon" size={28} />
          <h1>Crime Network Analysis</h1>
        </div>
        <div className="header-right">
          <UploadPanel onUpload={handleUpload} />
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Documents</h3>
            {documents.length === 0 ? (
              <p className="empty-state">No documents uploaded</p>
            ) : (
              <ul className="document-list">
                {documents.map(doc => (
                  <li 
                    key={doc.id}
                    className={`doc-item ${selectedDocId === doc.id ? 'active' : ''}`}
                    onClick={() => handleDocumentSelect(doc.id)}
                  >
                    <FileText size={16} />
                    <span className="doc-name" title={doc.filename}>
                      {doc.filename}
                    </span>
                    <button 
                      className="delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedDocId && (
            <div className="sidebar-section">
              <h3>Actions</h3>
              <button 
                className="action-btn primary"
                onClick={() => handleProcess(selectedDocId!)}
                disabled={processing || !!result}
              >
                {processing ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    Processing...
                  </>
                ) : result ? (
                  <>
                    <Eye size={16} />
                    View Results
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Analyze Document
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <StatsBar 
              entityCount={result.entities.length}
              relationshipCount={result.relationships.length}
              suspiciousCount={result.suspicious_entities.length}
              typeCounts={getTypeCounts()}
            />
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {selectedDocId ? (
            result ? (
              <div className="results-container">
                <div className="tabs">
                  <button
                    className={activeTab === 'network' ? 'active' : ''}
                    onClick={() => setActiveTab('network')}
                  >
                    <Network size={16} />
                    Network Graph
                  </button>
                  <button
                    className={activeTab === 'entities' ? 'active' : ''}
                    onClick={() => setActiveTab('entities')}
                  >
                    <Users size={16} />
                    Entities ({result.entities.length})
                  </button>
                  <button
                    className={activeTab === 'suspicious' ? 'active' : ''}
                    onClick={() => setActiveTab('suspicious')}
                  >
                    <AlertTriangle size={16} />
                    Suspicious ({result.suspicious_entities.length})
                  </button>
                </div>

                <div className="tab-content">
                  {activeTab === 'network' && (
                    <NetworkGraph 
                      graph={result.graph}
                      entities={result.entities}
                    />
                  )}
                  
                  {activeTab === 'entities' && (
                    <EntityPanel 
                      entities={result.entities}
                      relationships={result.relationships}
                    />
                  )}
                  
                  {activeTab === 'suspicious' && (
                    <SuspiciousPanel 
                      suspiciousEntities={result.suspicious_entities}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state-large">
                <Search size={64} />
                <h2>Ready to Analyze</h2>
                <p>Select a document and click "Analyze Document" to extract entities, map relationships, and detect suspicious patterns.</p>
                <button 
                  className="action-btn primary"
                  onClick={() => handleProcess(selectedDocId!)}
                >
                  <Search size={18} />
                  Analyze Document
                </button>
              </div>
            )
          ) : (
            <div className="empty-state-large">
              <Upload size={64} />
              <h2>Upload a Crime Report</h2>
              <p>Upload FIR, police reports, or investigation documents to begin network analysis.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;