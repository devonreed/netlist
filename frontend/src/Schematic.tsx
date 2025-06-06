import { useEffect, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import type { Netlist } from "./Netlist.tsx";
import type { ElkNode, ElkExtendedEdge } from "elkjs";

const elk = new ELK();

// Types for the graph we feed ELK
interface ElkGraph extends ElkNode {
  children: ElkNode[];
  edges: ElkExtendedEdge[]; // must be extended edge with sources/targets
}

function convertNetlistToELKGraph(netlist: Netlist): ElkGraph {
  const nodes: ElkNode[] = netlist.components.map((comp) => ({
    id: comp.id,
    labels: [{ text: `${comp.id}\n${comp.type}\n${comp.value}` }],
    width: 80,
    height: 50,
  }));

  const edges: ElkExtendedEdge[] = [];

  netlist.nets.forEach((net) => {
    const connectedPins = net.nodes;
    for (let i = 0; i < connectedPins.length; i++) {
      for (let j = i + 1; j < connectedPins.length; j++) {
        const sourcePin = connectedPins[i];
        const targetPin = connectedPins[j];
        const sourceNode = sourcePin.split(".")[0];
        const targetNode = targetPin.split(".")[0];
        if (sourceNode !== targetNode) {
          edges.push({
            id: `${net.id}-${sourceNode}-${targetNode}`,
            sources: [sourceNode],
            targets: [targetNode],
          });
        }
      }
    }
  });

  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.layered.spacing.nodeNodeBetweenLayers": "50",
      "elk.layered.spacing.nodeNode": "50",
      "elk.edgeRouting": "ORTHOGONAL",
    },
    children: nodes,
    edges,
  };
}

interface SchematicProps {
  netlist: Netlist;
}

export default function Schematic({ netlist }: SchematicProps) {
  const [layout, setLayout] = useState<ElkNode | null>(null);

  useEffect(() => {
    const elkGraph = convertNetlistToELKGraph(netlist);
    elk
      .layout(elkGraph)
      .then((layoutedGraph) => {
        setLayout(layoutedGraph);
      })
      .catch((err) => {
        console.error("ELK layout error:", err);
      });
  }, [netlist]); // <- add netlist dependency here

  if (!layout) return <div>Calculating layout...</div>;

  // Defensive: type cast children and edges
  const children = (layout.children || []) as ElkNode[];
  const edges = (layout.edges || []) as ElkExtendedEdge[];

  return (
    <svg
      width={(layout.width ?? 0) + 50}
      height={(layout.height ?? 0) + 50}
      style={{ border: "1px solid #ccc" }}
    >
      {/* Edges */}
      {edges.map((edge) => {
        if (!edge.sections || edge.sections.length === 0) return null;
        const section = edge.sections[0];
        const points = [
          section.startPoint,
          ...(section.bendPoints || []),
          section.endPoint,
        ];
        return (
          <polyline
            key={edge.id}
            fill="none"
            stroke="#333"
            strokeWidth={2}
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          />
        );
      })}

      {/* Nodes */}
      {children.map((node) => {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        const width = node.width ?? 80;
        const height = node.height ?? 50;
        const labelText = node.labels?.[0]?.text ?? "";

        return (
          <g key={node.id} transform={`translate(${x},${y})`}>
            <rect
              width={width}
              height={height}
              fill="#def"
              stroke="#36c"
              strokeWidth={2}
              rx={8}
              ry={8}
            />
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              alignmentBaseline="middle"
              style={{ userSelect: "none", fontFamily: "monospace", fontSize: 12 }}
            >
              {labelText}
            </text>
          </g>
        );
      })}
    </svg>
  );
}