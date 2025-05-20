import React, { useRef, useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import PropTypes from "prop-types";
import "../../styles/TriadCensusVisualization.css";
import { triadDescriptions } from "../../constants/triadDescriptions";

const TriadCensusVisualization = ({ triadCensusData }) => {
  const forceGraphRef = useRef(null);
  const [selectedTriad, setSelectedTriad] = useState(null);

  useEffect(() => {
    if (forceGraphRef.current) {
      const graph = forceGraphRef.current;
      graph.d3Force("charge")?.strength(-150);
      graph.d3Force("link")?.distance(100);
      forceGraphRef.current.zoomToFit(400, 100);
    }
  }, [triadCensusData]);

  if (!triadCensusData || !triadCensusData.triad_census) {
    return <div>No triad census data available</div>;
  }

  const { triad_census, total_triads, original_network } = triadCensusData;
  const descriptions = triadDescriptions;

  const prepareNetworkData = () => {
    if (
      !original_network ||
      !original_network.nodes ||
      !original_network.links
    ) {
      return { nodes: [], links: [] };
    }

    const nodes = JSON.parse(JSON.stringify(original_network.nodes));
    const links = JSON.parse(JSON.stringify(original_network.links));

    const assignTriadTypes = () => {
      const types = Object.keys(triad_census);

      const linkPairs = {};

      links.forEach((link, index) => {
        const source =
          typeof link.source === "object" ? link.source.id : link.source;
        const target =
          typeof link.target === "object" ? link.target.id : link.target;

        const pair = [source, target].sort().join("-");

        if (!linkPairs[pair]) {
          linkPairs[pair] = types[index % types.length];
        }

        link.triadType = linkPairs[pair];
      });
    };

    assignTriadTypes();

    return { nodes, links };
  };

  const networkData = prepareNetworkData();

  const sortedTriads = Object.entries(triad_census).sort(
    (a, b) => b[1].count - a[1].count
  );

  const getTriadColor = (triadType) => {
    const colorMap = {
      "003": "#7a7a7a", // Empty - gray
      "012": "#66CCFF", // Single edge - light blue
      102: "#3399FF", // One mutual - blue
      "021D": "#99CC33", // Out-star - light green
      "021U": "#669900", // In-star - green
      "021C": "#FFCC00", // Chain - yellow
      "111D": "#FF9900", // Out-star with mutual - orange
      "111U": "#FF6600", // In-star with mutual - dark orange
      "030T": "#9933CC", // Transitive - purple
      "030C": "#CC33FF", // Cycle - light purple
      201: "#FF3366", // Two mutuals one non - pink
      "120D": "#CC0066", // Out-star with two mutuals - dark pink
      "120U": "#990033", // In-star with two mutuals - red-brown
      "120C": "#CC3300", // Chain with two mutuals - red-orange
      210: "#663300", // Three nodes, two with mutual - brown
      300: "#000000", // Complete - black
    };

    return colorMap[triadType] || "#AAAAAA";
  };

  const handleTriadSelect = (triadType) => {
    setSelectedTriad(selectedTriad === triadType ? null : triadType);
  };

  return (
    <div className="triad-visualization-container">
      <div className="triad-graph-container">
        <ForceGraph2D
          ref={forceGraphRef}
          graphData={networkData}
          width={1000}
          height={700}
          nodeRelSize={6}
          fitView
          fitViewPadding={20}
          nodeAutoColorBy={null}
          linkWidth={(link) => {
            const baseWidth = Math.sqrt(link.weight || 1);
            return selectedTriad && link.triadType === selectedTriad
              ? baseWidth * 2
              : baseWidth;
          }}
          linkColor={(link) => {
            if (selectedTriad) {
              return link.triadType === selectedTriad
                ? "#F5BD20"
                : "rgba(200, 200, 200, 0.3)";
            }
            return getTriadColor(link.triadType);
          }}
          cooldownTicks={200}
          enableNodeDrag={true}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.2}
          onEngineStop={() => forceGraphRef.current?.zoomToFit(400, 100)}
          onNodeDragEnd={(node) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          linkCanvasObject={(link, ctx, globalScale) => {
            if (!link.source || !link.target) return;

            ctx.beginPath();
            ctx.moveTo(link.source.x, link.source.y);
            ctx.lineTo(link.target.x, link.target.y);

            ctx.strokeStyle = selectedTriad
              ? link.triadType === selectedTriad
                ? getTriadColor(link.triadType)
                : "rgba(200, 200, 200, 0.3)"
              : getTriadColor(link.triadType);

            ctx.lineWidth = Math.sqrt(link.weight || 1);
            if (selectedTriad && link.triadType === selectedTriad) {
              ctx.lineWidth *= 2;
            }

            ctx.stroke();

            if (globalScale > 1.5) {
              const midX = (link.source.x + link.target.x) / 2;
              const midY = (link.source.y + link.target.y) / 2;
              const fontSize = 10 / globalScale;
              ctx.save();
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillStyle = "black";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(link.weight || "1", midX, midY);
              ctx.restore();
            }

            if (link.source && link.target) {
              const targetRadius = link.target.size || 20;

              const dx = link.target.x - link.source.x;
              const dy = link.target.y - link.source.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist === 0) return;

              const arrowX = link.target.x - (dx * targetRadius) / dist;
              const arrowY = link.target.y - (dy * targetRadius) / dist;

              const angle = Math.atan2(dy, dx);
              const arrowLength = 10 / globalScale;
              const arrowWidth = 5 / globalScale;

              ctx.save();
              ctx.translate(arrowX, arrowY);
              ctx.rotate(angle);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(-arrowLength, arrowWidth);
              ctx.lineTo(-arrowLength, -arrowWidth);
              ctx.closePath();
              ctx.fillStyle = selectedTriad
                ? link.triadType === selectedTriad
                  ? getTriadColor(link.triadType)
                  : "rgba(200, 200, 200, 0.3)"
                : getTriadColor(link.triadType);
              ctx.fill();
              ctx.restore();
            }
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const fontSize = 12 / globalScale;
            const radius = node.size || 20;

            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

            ctx.fillStyle = node.color || "#1f77b4";
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (selectedTriad) {
              const isInSelectedTriad = networkData.links.some((link) => {
                const sourceId =
                  typeof link.source === "object"
                    ? link.source.id
                    : link.source;
                const targetId =
                  typeof link.target === "object"
                    ? link.target.id
                    : link.target;
                return (
                  link.triadType === selectedTriad &&
                  (sourceId === node.id || targetId === node.id)
                );
              });

              if (isInSelectedTriad) {
                ctx.strokeStyle = getTriadColor(selectedTriad);
                ctx.lineWidth = 3;
                ctx.stroke();
              }
            }

            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textWidth = ctx.measureText(node.id).width;
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(
              node.x - textWidth / 2 - 2,
              node.y - fontSize / 2 - 1,
              textWidth + 4,
              fontSize + 2
            );

            ctx.fillStyle = "#000000";
            ctx.fillText(node.id, node.x, node.y);
            ctx.restore();
          }}
        />
      </div>

      <div className="triad-info-panel">
        <div className="triad-info-header">
          <h4>Triad Census Analysis</h4>
          <div>Total Triads: {total_triads}</div>
        </div>

        <div className="triad-legend">
          <h5>Triad Types</h5>
          <div className="triad-legend-items">
            {sortedTriads.map(([triadType, data]) => (
              <div
                key={triadType}
                className={`triad-legend-item ${
                  selectedTriad === triadType ? "selected" : ""
                }`}
                onClick={() => handleTriadSelect(triadType)}
              >
                <div
                  className="color-box"
                  style={{ backgroundColor: getTriadColor(triadType) }}
                ></div>
                <div className="triad-info">
                  <div className="triad-name">
                    <strong>{triadType}</strong>
                    <span className="triad-count">
                      {data.count} ({data.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="triad-description">
                    {descriptions[triadType]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

TriadCensusVisualization.propTypes = {
  triadCensusData: PropTypes.object.isRequired,
};

export default TriadCensusVisualization;
