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
      const portEntries = Object.entries(comp.pins ?? {});
      const ports = portEntries.map(([pinName], index) => ({
        id: `${comp.id}.${pinName}`,
        properties: {
          "port.side": index % 2 === 0 ? "WEST" : "EAST",
          "port.alignment": "CENTER",
        },
      }));

      nodes.push({
        id: comp.id,
        labels: [
          { text: comp.id },
          { text: comp.value || "" },
          { text: comp.type || "" }
        ],
        width: 80,
        height: 50,
        ports,
        layoutOptions: {
          "elk.portConstraints": "FIXED_SIDE"
        }
      });
    }
  });

  netlist.nets.forEach((net) => {
    const connectedPins = net.nodes;

    for (let i = 0; i < connectedPins.length; i++) {
      for (let j = i + 1; j < connectedPins.length; j++) {
        const [srcId, srcPin] = connectedPins[i].split(".");
        const [tgtId, tgtPin] = connectedPins[j].split(".");

        const srcComp = netlist.components.find(c => c.id === srcId);
        const tgtComp = netlist.components.find(c => c.id === tgtId);

        let sourceNode = srcId;
        let targetNode = tgtId;
        let sourcePort = `${srcId}.${srcPin}`;
        let targetPort = `${tgtId}.${tgtPin}`;

        // Handle ground nodes
        if (srcComp?.type === "ground") {
          sourceNode = `GND@${net.id}-${i}-${Math.random().toString(36).slice(2, 7)}`;
          sourcePort = `${sourceNode}_top`;
          nodes.push({
            id: sourceNode,
            width: 30,
            height: 30,
            ports: [
              {
                id: sourcePort,
                layoutOptions: {
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

        if (tgtComp?.type === "ground") {
          targetNode = `GND@${net.id}-${j}-${Math.random().toString(36).slice(2, 7)}`;
          targetPort = `${targetNode}_top`;
          nodes.push({
            id: targetNode,
            width: 30,
            height: 30,
            ports: [
              {
                id: sourcePort,
                layoutOptions: {
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

        if (sourceNode !== targetNode) {
          edges.push({
            id: `${net.id}-${sourceNode}-${targetNode}`,
            sources: [sourceNode],
            targets: [targetNode],
            ...(sourcePort && { sourcePort }),
            ...(targetPort && { targetPort }),
          } as ElkExtendedEdge);
        }
      }
    }
  });

  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN", // more compact layout
      "elk.layered.spacing.nodeNodeBetweenLayers": "40",
      "elk.layered.spacing.nodeNode": "40",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
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
                    const centerY = height / 2;
                    switch (node.labels?.[2].text) {
                      case "resistor":
                        return (
                          <path
                            d={`M ${centerX - 15},${centerY}
                                l 3,-4.5 l 3,9 l 3,-9 l 3,9 l 3,-9 l 3,9 l 3,-4.5`}
                            stroke="#000"
                            fill="none"
                            strokeWidth={1.2}
                          />
                        );

                      case "capacitor":
                        return (
                          <>
                            <line x1={centerX - 6} y1={centerY - 6} x2={centerX - 6} y2={centerY + 6} stroke="#000" strokeWidth={1.2} />
                            <line x1={centerX + 6} y1={centerY - 6} x2={centerX + 6} y2={centerY + 6} stroke="#000" strokeWidth={1.2} />
                            <line x1={centerX - 12} y1={centerY} x2={centerX - 6} y2={centerY} stroke="#000" strokeWidth={1.2} />
                            <line x1={centerX + 6} y1={centerY} x2={centerX + 12} y2={centerY} stroke="#000" strokeWidth={1.2} />
                          </>
                        );

                      case "voltage":
                        return (
                          <>
                            <circle cx={centerX} cy={centerY} r={7.5} stroke="#000" fill="none" strokeWidth={1.2} />
                            <line x1={centerX} y1={centerY - 4.5} x2={centerX} y2={centerY + 4.5} stroke="#000" strokeWidth={1.2} />
                            <line x1={centerX - 3} y1={centerY} x2={centerX + 3} y2={centerY} stroke="#000" strokeWidth={1.2} />
                          </>
                        );
                      default:
                        return null;
                    }
                  })()}

                  {/* ID label */}
                  <text
                    x={width / 2}
                    y={10}
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
                      y={35}
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