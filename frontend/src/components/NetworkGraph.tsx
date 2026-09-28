import React, { useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  // Node, 
  // Edge,
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
  ORGANIZATION: 'Org',
  DATE: 'Date',
  MONEY: 'Money',
  EMAIL: 'Email',
};

// Custom Node Component
const CustomNode: React.FC<{ data: { label: string; type: string; size: number; color: string }; selected?: boolean }> = ({ 
  data, 
  selected 
}) => {
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
            {data.label.length > 20 ? data.label.substring(0, 20) + '...' : data.label}
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
  
  return (
    <path
      id={id}
      d={path}
      stroke="#555"
      strokeWidth={Math.max(1, (data?.weight || 1) * 2)}
      strokeOpacity={0.6}
      fill="none"
      markerEnd="url(#arrowhead)"
      className="edge-path"
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
        size: Math.max(120, n.size),
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
      style: { stroke: e.color, strokeWidth: Math.max(1, e.weight * 2) },
      markerEnd: { type: MarkerType.ArrowClosed, color: e.color },
    }))
  );

  const onConnect = (connection: Connection) => {
    setEdges((eds: any[]) => addEdge({ 
      ...connection, 
      type: 'custom',
      data: { type: 'RELATED_TO', weight: 0.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
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
          color="#222" 
          gap={16} 
          style={{ opacity: 0.3 }}
        />
        <Controls />
        <MiniMap 
          nodeColor={(node: { data: { color: string } }) => node.data.color}
          maskColor="rgba(228, 26, 28, 0.3)"
        />
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth={10} 
            markerHeight={7} 
            refX={9} 
            refY={3.5} 
            orient="auto"
          >
            <path d="M0,0 L0,7 L9,3.5 Z" fill="#555" />
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

// Need TYPE_COLORS
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

export default NetworkGraph;