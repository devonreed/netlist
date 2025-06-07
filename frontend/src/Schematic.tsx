import { useEffect, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import type { Netlist } from "./Netlist";
import type { ElkNode, ElkExtendedEdge } from "elkjs";

const elk = new ELK();

interface ElkGraph extends ElkNode {
  children: ElkNode[];
  edges: ElkExtendedEdge[];
}

function convertNetlistToELKGraph(netlist: Netlist): ElkGraph {
  const nodes: ElkNode[] = [];
  const edges: ElkExtendedEdge[] = [];

  netlist.components.forEach((comp) => {
    if (comp.type !== "ground") {
      nodes.push({
        id: comp.id,
        labels: [
          { text: comp.id },
          { text: comp.value || "" },
          { text: comp.type || "" }
        ],
        width: 80,
        height: 50,
      });
    }
  });

  netlist.nets.forEach((net) => {
    const connectedPins = net.nodes;

    for (let i = 0; i < connectedPins.length; i++) {
      for (let j = i + 1; j < connectedPins.length; j++) {
        const sourcePin = connectedPins[i];
        const targetPin = connectedPins[j];
        const sourceNodeId = sourcePin.split(".")[0];
        const targetNodeId = targetPin.split(".")[0];

        const sourceComp = netlist.components.find(c => c.id === sourceNodeId);
        const targetComp = netlist.components.find(c => c.id === targetNodeId);

        let sourceNode = sourceNodeId;
        let targetNode = targetNodeId;

        let sourcePort, targetPort;

        if (sourceComp?.type === "ground") {
          sourceNode = `GND@${net.id}-${i}-${Math.random().toString(36).slice(2, 7)}`;
          sourcePort = `${sourceNode}_top`;
          nodes.push({
            id: sourceNode,
            width: 30,
            height: 30,
            ports: [
              {
                id: sourcePort,
                properties: {
                  "port.side": "NORTH",
                  "port.alignment": "CENTER",
                },
              },
            ],
            layoutOptions: {
              "elk.portConstraints": "FIXED_SIDE"
            }
          });
        }

        if (targetComp?.type === "ground") {
          targetNode = `GND@${net.id}-${j}-${Math.random().toString(36).slice(2, 7)}`;
          targetPort = `${targetNode}_top`;
          nodes.push({
            id: targetNode,
            width: 30,
            height: 30,
            ports: [
              {
                id: targetPort,
                properties: {
                  "port.side": "NORTH",
                  "port.alignment": "CENTER",
                },
              },
            ],
            layoutOptions: {
              "elk.portConstraints": "FIXED_SIDE"
            }
          });
        }

        const edge: ElkExtendedEdge = {
          id: `${net.id}-${sourceNode}-${targetNode}`,
          sources: [sourceNode],
          targets: [targetNode],
        };

        if (sourcePort) edge.sourcePort = sourcePort;
        if (targetPort) edge.targetPort = targetPort;

        if (sourceNode !== targetNode) {
          edges.push(edge);
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
      "elk.layered.nodePlacement.strategy": "SIMPLE",
      "elk.layered.nodePlacement.favorStraightEdges": "true",
      "elk.portConstraints": "FIXED_SIDE",
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
  }, [netlist]);

  if (!layout) return <div>Calculating layout...</div>;

  const children = (layout.children || []) as ElkNode[];
  const edges = (layout.edges || []) as ElkExtendedEdge[];

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto">
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
          const isGround = node.id.startsWith("GND@");

          const labelMain = node.labels?.[0]?.text ?? "";
          const labelValue = node.labels?.[1]?.text ?? "";

          return (
            <g key={node.id} transform={`translate(${x},${y})`}>
              {isGround ? (
                <>
                  <line x1={width / 2} y1={0} x2={width / 2} y2={10} stroke="black" />
                  <line x1={width / 2 - 6} y1={10} x2={width / 2 + 6} y2={10} stroke="black" />
                  <line x1={width / 2 - 4} y1={14} x2={width / 2 + 4} y2={14} stroke="black" />
                  <line x1={width / 2 - 2} y1={18} x2={width / 2 + 2} y2={18} stroke="black" />
                </>
              ) : (
                <>
                  <rect
                    width={width}
                    height={height}
                    fill="#def"
                    stroke="#36c"
                    strokeWidth={2}
                    rx={8}
                    ry={8}
                  />

                  {/* Component Symbol */}
                  {(() => {
                    const centerX = width / 2;
                    const centerY = height / 2 + 4;
                    switch (node.labels?.[2].text) {
                      case "resistor":
                        return (
                          <path
                            d={`M ${centerX - 20},${centerY}
                                l 4,-6 l 4,12 l 4,-12 l 4,12 l 4,-12 l 4,12 l 4,-6`}
                            stroke="#000"
                            fill="none"
                            strokeWidth={1.5}
                          />
                        );
                      case "capacitor":
                        return (
                          <>
                            <line x1={centerX - 8} y1={centerY - 8} x2={centerX - 8} y2={centerY + 8} stroke="#000" strokeWidth={1.5} />
                            <line x1={centerX + 8} y1={centerY - 8} x2={centerX + 8} y2={centerY + 8} stroke="#000" strokeWidth={1.5} />
                            <line x1={centerX - 16} y1={centerY} x2={centerX - 8} y2={centerY} stroke="#000" strokeWidth={1.5} />
                            <line x1={centerX + 8} y1={centerY} x2={centerX + 16} y2={centerY} stroke="#000" strokeWidth={1.5} />
                          </>
                        );
                      case "voltage":
                        return (
                          <>
                            <circle cx={centerX} cy={centerY} r={10} stroke="#000" fill="none" strokeWidth={1.5} />
                            <line x1={centerX} y1={centerY - 6} x2={centerX} y2={centerY + 6} stroke="#000" strokeWidth={1.5} />
                            <line x1={centerX - 4} y1={centerY} x2={centerX + 4} y2={centerY} stroke="#000" strokeWidth={1.5} />
                          </>
                        );
                      default:
                        return null;
                    }
                  })()}

                  {/* ID label */}
                  <text
                    x={width / 2}
                    y={14}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    style={{
                      userSelect: "none",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {labelMain}
                  </text>
                  {labelValue && (
                    <text
                      x={width / 2}
                      y={height + 4}
                      textAnchor="middle"
                      alignmentBaseline="hanging"
                      style={{
                        userSelect: "none",
                        fontFamily: "monospace",
                        fontSize: 12,
                        fill: "#444",
                      }}
                    >
                      {labelValue}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}