import { useCallback, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { Database, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LineageEdge {
  source_table_catalog: string;
  source_table_schema: string;
  source_table_name: string;
  target_table_catalog: string;
  target_table_schema: string;
  target_table_name: string;
  event_time?: string;
}

interface LineageGraphProps {
  edges: LineageEdge[];
  verificationStatus?: "verified" | "not_verifiable";
  diagnostic?: string;
  className?: string;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

function buildNodeId(catalog: string, schema: string, table: string) {
  return `${catalog}.${schema}.${table}`;
}

function applyDagreLayout(nodes: Node[], edges: Edge[], direction = "LR") {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40, marginx: 20, marginy: 20 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

// ─── Custom Node ─────────────────────────────────────────────────────────────

function TableNode({ data }: { data: any }) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border shadow-lg min-w-[160px] max-w-[200px]",
        "bg-card border-border hover:border-gold/40 transition-colors",
        data.isSource && "border-l-2 border-l-gold",
        data.isTarget && "border-r-2 border-r-info",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={cn(
          "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
          data.isSource ? "bg-gold-subtle" : "bg-info/10"
        )}>
          <Database className={cn("w-3 h-3", data.isSource ? "text-gold" : "text-info")} />
        </div>
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest",
          data.isSource ? "text-gold/70" : "text-info/70"
        )}>
          {data.isSource ? "Origem" : "Destino"}
        </span>
      </div>
      <p className="text-xs font-semibold text-foreground truncate leading-tight">{data.tableName}</p>
      <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">{data.schemaName}</p>
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LineageGraph({
  edges: lineageEdges,
  verificationStatus = "verified",
  diagnostic,
  className,
}: LineageGraphProps) {
  const { theme } = useTheme();
  const colorMode = theme === "dark" ? "dark" : "light";
  // Build unique nodes and edges from lineage data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const sourceIds = new Set<string>();
    const targetIds = new Set<string>();

    lineageEdges.forEach((e) => {
      const srcId = buildNodeId(e.source_table_catalog, e.source_table_schema, e.source_table_name);
      const tgtId = buildNodeId(e.target_table_catalog, e.target_table_schema, e.target_table_name);
      sourceIds.add(srcId);
      targetIds.add(tgtId);

      if (!nodeMap.has(srcId)) {
        nodeMap.set(srcId, {
          id: srcId,
          type: "tableNode",
          position: { x: 0, y: 0 },
          data: {
            tableName: e.source_table_name,
            schemaName: `${e.source_table_catalog}.${e.source_table_schema}`,
            isSource: true,
            isTarget: false,
          },
        });
      }
      if (!nodeMap.has(tgtId)) {
        nodeMap.set(tgtId, {
          id: tgtId,
          type: "tableNode",
          position: { x: 0, y: 0 },
          data: {
            tableName: e.target_table_name,
            schemaName: `${e.target_table_catalog}.${e.target_table_schema}`,
            isSource: false,
            isTarget: true,
          },
        });
      }
    });

    // Nodes that appear as both source and target
    nodeMap.forEach((node, id) => {
      if (sourceIds.has(id) && targetIds.has(id)) {
        node.data = { ...node.data, isSource: true, isTarget: true };
      }
    });

    const rawNodes = Array.from(nodeMap.values());
    const rawEdges: Edge[] = lineageEdges.map((e, i) => ({
      id: `edge-${i}`,
      source: buildNodeId(e.source_table_catalog, e.source_table_schema, e.source_table_name),
      target: buildNodeId(e.target_table_catalog, e.target_table_schema, e.target_table_name),
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--gold)", strokeWidth: 1.5, opacity: 0.7 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--gold)",
        width: 16,
        height: 16,
      },
      label: e.event_time
        ? new Date(e.event_time).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        : undefined,
      labelStyle: { fontSize: 10, fill: "var(--muted-foreground)" },
      labelBgStyle: { fill: "var(--card)", fillOpacity: 0.8 },
    }));

    const layoutedNodes = applyDagreLayout(rawNodes, rawEdges, "LR");

    return { initialNodes: layoutedNodes, initialEdges: rawEdges };
  }, [lineageEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (lineageEdges.length === 0) {
    const notVerifiable = verificationStatus === "not_verifiable";
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-xl bg-muted/20 border border-border py-14 text-center", className)}>
        <div className={cn(
          "w-12 h-12 rounded-xl border flex items-center justify-center mb-4",
          notVerifiable ? "bg-warning/10 border-warning/20" : "bg-gold-subtle border-gold/20",
        )}>
          <ArrowRight className={cn("w-6 h-6", notVerifiable ? "text-warning/70" : "text-gold/50")} />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          {notVerifiable ? "Linhagem não verificável" : "Nenhuma linhagem registrada"}
        </p>
        <p className="text-xs text-muted-foreground max-w-md">
          {notVerifiable
            ? diagnostic ?? "O principal da auditoria não possui permissão para consultar system.access.table_lineage."
            : <>Não foram encontradas relações de linhagem em <code className="font-mono text-gold/70">system.access.table_lineage</code> para o catálogo auditado.</>}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden border border-border", className)} style={{ height: 420 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        colorMode={colorMode as "dark" | "light"}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border)"
        />
        <Controls
          showInteractive={false}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            gap: "2px",
          }}
        />
        <MiniMap
          nodeColor={(n) =>
            (n.data as any)?.isSource && (n.data as any)?.isTarget
              ? "var(--warning)"
              : (n.data as any)?.isSource
              ? "var(--gold)"
              : "var(--info)"
          }
          maskColor="rgba(0,0,0,0.4)"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        />
        <Panel position="top-left">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card/90 border border-border text-[10px] text-muted-foreground backdrop-blur-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gold inline-block" />
              Origem
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-info inline-block" />
              Destino
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-warning inline-block" />
              Origem + Destino
            </span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
