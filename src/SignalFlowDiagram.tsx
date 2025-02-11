import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Controls, 
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

interface TimePoint {
  value: number;
  unit: string;
}

interface TimeRange {
  start: TimePoint;
  end: TimePoint;
}

interface BaseNodeData {
  fieldName?: string;
}

interface RelativeTimeValueData extends BaseNodeData {
  timePoint: TimePoint;
}

interface DailyAggregationData extends BaseNodeData {
  timeRange: TimeRange;
  aggregationType: string;
}

interface RateOfChangeData extends BaseNodeData {
  leftOperand?: { type: string };
  rightOperand?: { type: string };
  isExpanded?: boolean;  // Controls whether handles are visible
  hasLeftOperand?: boolean;  // Track if the left operand handle is connected
  hasRightOperand?: boolean; // Track if the right operand handle is connected
}

interface ConditionData extends BaseNodeData {
  condition: {
    operator: string;
    threshold: number;
  };
}

interface SignalData extends BaseNodeData {
  name: string;
  description: string;
}

type CustomNodeData = 
  | RelativeTimeValueData 
  | DailyAggregationData 
  | RateOfChangeData 
  | ConditionData 
  | SignalData;

interface NodeConnectionRules {
  [key: string]: {
    canConnectTo: string[];
    maxOutgoing: number;
    requiredInputs?: number;
  };
}

type CustomNodeType =  'relativeTimeValue' | 'dailyAggregation' | 'rateOfChange' | 'condition' | 'signal';


const BaseNode: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 rounded-lg shadow-md bg-white border-2 min-w-[200px] ${className}`}>
    {children}
  </div>
);

const RelativeTimeValueNode: React.FC<NodeProps<RelativeTimeValueData>> = ({ data }) => (
  <BaseNode className="border-blue-400 relative">
    <div className="font-semibold text-blue-600 mb-2">Current Trade Count</div>
    <div className="text-sm space-y-1">
      <div>Field: <span className="font-medium">{data.fieldName}</span></div>
      <div>Time: <span className="font-medium">{data.timePoint.value} {data.timePoint.unit}s ago</span></div>
    </div>

    {/* Output Handle */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="output"  // 🔥 Enables connection from this node
      style={{ background: '#3b82f6' }}
    />
  </BaseNode>
);
const DailyAggregationNode: React.FC<NodeProps<DailyAggregationData>> = ({ data }) => (
  <BaseNode className="border-green-400 relative">
    <div className="font-semibold text-green-600 mb-2">Historical High</div>
    <div className="text-sm space-y-1">
      <div>Field: <span className="font-medium">{data.fieldName}</span></div>
      <div>Range: <span className="font-medium">{data.timeRange.end.value} to {data.timeRange.start.value} {data.timeRange.start.unit}s ago</span></div>
      <div>Type: <span className="font-medium capitalize">{data.aggregationType}</span></div>
    </div>

    {/* Output Handle */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="output"  // 🔥 Enables connection from this node
      style={{ background: '#10b981' }}
    />
  </BaseNode>
);
const RateOfChangeNode: React.FC<NodeProps<RateOfChangeData>> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Local state for expand/collapse

  return (
    <BaseNode className="border-purple-400 relative">
      <div className="font-semibold text-purple-600 mb-2 flex justify-between">
        Rate of Change
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs bg-gray-200 px-2 py-1 rounded"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <div className="text-sm space-y-1">
        <div>Operation: <span className="font-medium">Percentage Change</span></div>
        <div className="text-xs text-gray-500 mt-1">Compares current vs historical values</div>
      </div>

      {/* Left Operand Input */}
      <Handle
        type="target"
        position={Position.Top}
        id="leftOperand"
        style={{
          left: 20,
          width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid white',
          background: '#7c3aed',
          visibility: isExpanded ? 'visible' : 'hidden',
        }}
      />

      {/* Right Operand Input */}
      <Handle
        type="target"
        position={Position.Top}
        id="rightOperand"
        style={{
          right: 20,
          background: '#7c3aed',
          visibility: isExpanded ? 'visible' : 'hidden',
        }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ background: '#7c3aed' }}
      />
    </BaseNode>
  );
};

const ConditionNode: React.FC<NodeProps<ConditionData>> = ({ data }) => (
  <BaseNode className="border-orange-400 relative">
    <div className="font-semibold text-orange-600 mb-2">Threshold Check</div>
    <div className="text-sm space-y-1">
      <div>Condition: <span className="font-medium">{data.condition.operator} {data.condition.threshold}%</span></div>
    </div>

    {/* Input Handle */}
    <Handle type="target" position={Position.Top} id="input" style={{ background: '#f97316' }} />

    {/* Output Handle */}
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#f97316' }} />
  </BaseNode>
);

const SignalNode: React.FC<NodeProps<SignalData>> = ({ data }) => (
  <BaseNode className="border-red-400 relative">
    <div className="font-semibold text-red-600 mb-2">{data.name}</div>
    <div className="text-sm text-gray-600">{data.description}</div>

    {/* Input Handle */}
    <Handle type="target" position={Position.Top} id="input" style={{ background: '#ef4444' }} />
  </BaseNode>
);
const nodeConnectionRules: NodeConnectionRules = {
  relativeTimeValue: {
    canConnectTo: ['rateOfChange'],
    maxOutgoing: Infinity,
    requiredInputs: 0,
  },
  dailyAggregation: {
    canConnectTo: ['rateOfChange'],
    maxOutgoing: Infinity,
    requiredInputs: 0,
  },
  rateOfChange: {
    canConnectTo: ['condition'],
    maxOutgoing: 1,
    requiredInputs: 2, // Requires 2 inputs
    
  },
  condition: {
    canConnectTo: ['signal'],
    maxOutgoing: 1,
    requiredInputs: 1,
  },
  signal: {
    canConnectTo: [],
    maxOutgoing: 0,
    requiredInputs: 1,
  },
};
interface SidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => {
  const nodeTypes = [
    { type: 'relativeTimeValue', label: 'Current Value', class: 'bg-blue-100 border-blue-400' },
    { type: 'dailyAggregation', label: 'Historical Value', class: 'bg-green-100 border-green-400' },
    { type: 'rateOfChange', label: 'Rate of Change', class: 'bg-purple-100 border-purple-400' },
    { type: 'condition', label: 'Threshold Check', class: 'bg-orange-100 border-orange-400' },
    { type: 'signal', label: 'Signal', class: 'bg-red-100 border-red-400' },
  ];

  return (
    <div className="w-64 bg-white p-4 border-r border-gray-200 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Add Nodes</h3>
      <div className="space-y-3">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            className={`p-3 rounded-lg border-2 cursor-move ${nodeType.class}`}
            onDragStart={(event) => onDragStart(event, nodeType.type)}
            draggable
          >
            {nodeType.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: '1',
    type: 'relativeTimeValue',
    position: { x: 50, y: 50 },
    data: {
      fieldName: 'tradeCount',
      timePoint: { value: 30, unit: 'second' }
    }
  },
  {
    id: '2',
    type: 'dailyAggregation',
    position: { x: 50, y: 200 },
    data: {
      fieldName: 'tradeCount',
      timeRange: {
        start: { value: 5, unit: 'day' },
        end: { value: 1, unit: 'day' }
      },
      aggregationType: 'high'
    }
  },
  {
    id: '3',
    type: 'rateOfChange',
    position: { x: 350, y: 125 },
    data: {
      leftOperand: { type: 'relativeTimeValue' },
      rightOperand: { type: 'dailyAggregation' },
      isExpanded: true,
    }
  },
  {
    id: '4',
    type: 'condition',
    position: { x: 650, y: 125 },
    data: {
      condition: {
        operator: 'gt',
        threshold: 50.0
      }
    }
  },
  {
    id: '5',
    type: 'signal',
    position: { x: 950, y: 125 },
    data: {
      name: 'High Trade Count Velocity',
      description: 'Signals when current 30-second trade count velocity vs 5-day high is above threshold'
    }
  }
];
const initialEdges = [
  { 
    id: 'e1-3', 
    source: '1', 
    target: '3', 
    sourceHandle: 'output', 
    targetHandle: 'leftOperand', 
    animated: true,
    style: { stroke: '#4f46e5', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' } // 🔥 Adds arrow
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    sourceHandle: 'output', 
    targetHandle: 'rightOperand', 
    animated: true,
    style: { stroke: '#4f46e5', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' } // 🔥 Adds arrow
  },
];
const nodeTypes = {
  relativeTimeValue: RelativeTimeValueNode,
  dailyAggregation: DailyAggregationNode,
  rateOfChange: RateOfChangeNode,
  condition: ConditionNode,
  signal: SignalNode
};

const SignalFlowDiagram: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const validateConnection = (connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
  
    if (!sourceNode || !targetNode) return false;
  
    const sourceRules = nodeConnectionRules[sourceNode.type as CustomNodeType];
    const targetRules = nodeConnectionRules[targetNode.type as CustomNodeType];
  
    if (!sourceRules || !targetRules) return false;
  
    // Check if the target node is a RateOfChange node and validate its handles
    if (targetNode.type === 'rateOfChange') {
      const targetData = targetNode.data as RateOfChangeData;  // Explicitly cast type
  
      if (!targetData.hasLeftOperand && !targetData.hasRightOperand) {
        console.warn("RateOfChange node is missing valid handles:", targetNode);
        return false;
      }
    }
  
    // Ensure valid connections
    if (!sourceRules.canConnectTo.includes(targetNode.type as CustomNodeType)) return false;
  
    const sourceOutgoing = edges.filter(e => e.source === connection.source).length;
    if (sourceOutgoing >= sourceRules.maxOutgoing) return false;
  
    const targetIncoming = edges.filter(e => e.target === connection.target).length;
    if (targetIncoming >= (targetRules.requiredInputs ?? 0)) return false;
  
    return true;
  };
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (!validateConnection(params)) return;
  
      let targetHandle = params.targetHandle || 'leftOperand'; // Default to `leftOperand`
  
      // If the target node is `rateOfChange`, determine correct handle
      const targetNode = nodes.find(n => n.id === params.target);
      if (targetNode?.type === 'rateOfChange') {
        const existingEdges = edges.filter(e => e.target === params.target);
  
        if (!existingEdges.some(e => e.targetHandle === 'leftOperand')) {
          targetHandle = 'leftOperand';
        } else if (!existingEdges.some(e => e.targetHandle === 'rightOperand')) {
          targetHandle = 'rightOperand';
        } else {
          console.warn("RateOfChange node already has two operands connected.");
          return;
        }
      }
  
     
    setEdges((eds) =>
      addEdge({
        ...params,
        animated: true, // 🔥 Makes the connection animated
        style: {
          stroke: '#4f46e5', // 🔵 Custom stroke color (Deep Blue)
          strokeWidth: 3, // ✨ Thicker edge for visibility
        },
        markerEnd: {
          type: MarkerType.ArrowClosed, // 🔥 Adds an arrow at the end
          width: 10, // Size of the arrow
          height: 10,
          color: '#4f46e5', // 🔵 Matches the stroke color
        },
      }, eds)
    );
  },
  [setEdges, nodes, edges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const getDefaultDataForType = (type: string): CustomNodeData => {
    switch (type) {
      case 'relativeTimeValue':
        return {
          fieldName: 'newField',
          timePoint: { value: 30, unit: 'second' }
        };
      case 'dailyAggregation':
        return {
          fieldName: 'newField',
          timeRange: {
            start: { value: 5, unit: 'day' },
            end: { value: 1, unit: 'day' }
          },
          aggregationType: 'high'
        };
      case 'rateOfChange':
        return {
          leftOperand: { type: 'relativeTimeValue' },
          rightOperand: { type: 'dailyAggregation' }
        };
      case 'condition':
        return {
          condition: {
            operator: 'gt',
            threshold: 50.0
          }
        };
      case 'signal':
        return {
          name: 'New Signal',
          description: 'Signal Description'
        };
      default:
        return {};
    }
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - 100,
        y: event.clientY - 50,
      };

      const newNode = {
        id: `${type}_${nodes.length + 1}`,
        type,
        position,
        data: getDefaultDataForType(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex h-screen">
      <Sidebar onDragStart={onDragStart} />
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default SignalFlowDiagram;