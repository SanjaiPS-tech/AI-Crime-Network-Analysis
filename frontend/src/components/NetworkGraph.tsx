import React, { useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Handle,
  Position,
  NodeTypes,
  EdgeTypes,
  type EdgeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Users, Phone, MapPin, Car, Network, Search, AlertTriangle, Mail } from 'lucide-react';
import './NetworkGraph.css';

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

interface Entity {
  id: string;
  text: string;
  type: string;
  confidence: number;
  metadata: Record<string, any>;
}

interface NetworkGraphProps {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  entities: Entity[];
}

// Custom Node Component
const CustomNode: React.FC<{ 
  data: { label: string; type: string; size: number; color: string }; 
  selected?: boolean 
}> = ({ data, selected }) => {
  const icon = TYPE_ICONS[data.type] || <Search size={14} />;
  const typeLabel = TYPE_LABELS[data.type] || data.type;

  return (
    <div 
      className={`custom-node ${selected ? 'selected' : ''}`}
      style={{ 
        borderColor: data.color,
        minWidth: data.size,
      }}
    >
      <Handle type="target" position={Position.Top} className="node-handle" />
      <div className="node-content">
        <div className="node-main">
          <span className="node-icon" style={{ color: data.color }}>
            {icon}
          </span>
          <span className="node-label" title={data.label}>
            {data.label.length > 22 ? data.label.substring(0, 22) + '...' : data.label}
          </span>
        </div>
        <div className="node-type" style={{ color: data.color }}>
          {typeLabel}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
};

// Custom Edge Component
const CustomEdge: React.FC<EdgeProps<{ type: string; weight: number }>> = ({ 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  id, 
  data, 
  style 
}) => {
  const path = `M${sourceX},${sourceY} C${(sourceX + targetX) / 2},${sourceY} ${(sourceX + targetX) / 2},${targetY} ${targetX},${targetY}`;
  const edgeColor = data?.type === 'CONTACTED' ? '#e94560' : 
                    data?.type === 'LOCATED_AT' ? '#22c55e' :
                    data?.type === 'OWNS' ? '#a855f7' :
                    data?.type === 'MEMBER_OF' ? '#f97316' :
                    data?.type === 'ASSOCIATED_WITH' ? '#64748b' : '#555';

  return (
    <path
      id={id}
      d={path}
      stroke={edgeColor}
      strokeWidth={Math.max(1.5, (data?.weight || 1) * 2.5)}
      strokeOpacity={0.7}
      fill="none"
      markerEnd="url(#arrowhead)"
      className="edge-path"
      style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
    />
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const NetworkGraph: React.FC<NetworkGraphProps> = ({ graph, entities }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, , onNodesChange] = useNodesState(
    graph.nodes.map(n => ({
      id: n.id,
      type: 'custom',
      position: { x: n.x || Math.random() * 800, y: n.y || Math.random() * 600 },
      data: {
        label: n.label,
        type: n.type,
        size: Math.max(130, n.size),
        color: n.color,
      },
      draggable: true,
    }))
  );
  
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    graph.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'custom',
      data: { type: e.type, weight: e.weight },
      animated: e.weight > 0.7,
      style: { stroke: e.color, strokeWidth: Math.max(1.5, e.weight * 2.5) },
      markerEnd: { type: MarkerType.ArrowClosed, color: e.color },
    }))
  );

  const onConnect = (connection: Connection) => {
    setEdges((eds: any[]) => addEdge({ 
      ...connection, 
      type: 'custom',
      data: { type: 'RELATED_TO', weight: 0.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    }, eds));
  };

  useEffect(() => {
    if (reactFlowWrapper.current) {
      // Fit view on mount
    }
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="network-empty">
        <Search size={48} />
        <p>No entities found in this document</p>
      </div>
    );
  }

  return (
    <div className="network-graph-container" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={true}
        attributionPosition="bottom-right"
      >
        <Background 
          color="#1a1a2e" 
          gap={16} 
          style={{ opacity: 0.4 }}
        />
        <Controls />
        <MiniMap 
          nodeColor={(node: { data: { color: string } }) => node.data.color}
          maskColor="rgba(233, 69, 96, 0.25)"
        />
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth={12} 
            markerHeight={8} 
            refX={10} 
            refY={4} 
            orient="auto"
          >
            <path d="M0,0 L0,8 L10,4 Z" fill="#555" />
          </marker>
        </defs>
      </ReactFlow>
      
      {/* Legend */}
      <div className="network-legend">
        <h4>Entity Types</h4>
        <div className="legend-items">
          {Object.entries(TYPE_ICONS).map(([type, icon]) => (
            entities.some(e => e.type === type) && (
              <div key={type} className="legend-item">
                <span className="legend-icon" style={{ color: TYPE_COLORS[type] }}>
                  {icon}
                </span>
                <span>{TYPE_LABELS[type]}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;