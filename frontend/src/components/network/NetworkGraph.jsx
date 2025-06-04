import React, { useRef, useEffect } from "react";
import { ForceGraph2D } from "react-force-graph";
import PropTypes from "prop-types";

const NetworkGraph = ({
  networkData,
  filteredNodes = [],
  filteredLinks = [],
  customizedNetworkData,
  selectedMetric,
  highlightCentralNodes = false,
  showMetrics = true,
  visualizationSettings = {},
  handleNodeClick,
  networkWasRestored = false,
  forceGraphRef,
  isDirectedGraph = false,
}) => {
  useEffect(() => {
    if (forceGraphRef.current) {
      forceGraphRef.current.zoomToFit(400, 100);
    }
  }, [networkData, forceGraphRef]);

  if (!networkData) {
    return <div>No network data available</div>;
  }

  return (
    <div
      className="graph-wrapper"
      style={{
        maxWidth: "100%",
        width: "100%",
        height: "700px",
        overflowX: "hidden",
        overflowY: "hidden",
        position: "relative",
        margin: "0 auto",
      }}
    >
      <ForceGraph2D
        ref={forceGraphRef}
        key={customizedNetworkData ? "customized" : "default"}
        graphData={{
          nodes: customizedNetworkData
            ? customizedNetworkData.nodes
            : filteredNodes,
          links: customizedNetworkData
            ? customizedNetworkData.links.map((link) => {
                const sourceNode = customizedNetworkData.nodes.find(
                  (node) =>
                    (typeof link.source === "object" &&
                      node.id === link.source.id) ||
                    node.id === link.source
                );

                const targetNode = customizedNetworkData.nodes.find(
                  (node) =>
                    (typeof link.target === "object" &&
                      node.id === link.target.id) ||
                    node.id === link.target
                );

                return {
                  source: sourceNode || link.source,
                  target: targetNode || link.target,
                  weight: link.weight || 1,
                };
              })
            : filteredLinks.map((link) => {
                const sourceNode = filteredNodes.find(
                  (node) =>
                    (typeof link.source === "object" &&
                      node.id === link.source.id) ||
                    node.id === link.source
                );

                const targetNode = filteredNodes.find(
                  (node) =>
                    (typeof link.target === "object" &&
                      node.id === link.target.id) ||
                    node.id === link.target
                );

                return {
                  source: sourceNode || link.source,
                  target: targetNode || link.target,
                  weight: link.weight || 1,
                };
              }),
        }}
        directed={isDirectedGraph}
        width={showMetrics ? 1200 : 1500}
        height={700}
        fitView
        fitViewPadding={20}
        nodeAutoColorBy={customizedNetworkData ? null : "id"}
        linkWidth={(link) => Math.sqrt(link.weight || 1)}
        linkColor={() => "gray"}
        enableNodeDrag={true}
        cooldownTicks={100}
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.2}
        onNodeClick={handleNodeClick}
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
          ctx.strokeStyle = "gray";
          ctx.lineWidth = Math.sqrt(link.weight || 1);
          ctx.stroke();
          
          // Calculate positions for weight label
          let labelX, labelY;
          
          if (isDirectedGraph) {
            // For directed graphs, place label near the arrowhead
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              // Calculate target radius for arrow positioning
              const targetRadius =
                link.target.size ||
                (selectedMetric === "PageRank Centrality"
                  ? Math.max(10, link.target.pagerank * 500)
                  : selectedMetric === "Eigenvector Centrality"
                  ? Math.max(10, link.target.eigenvector * 60)
                  : selectedMetric === "Closeness Centrality"
                  ? Math.max(10, link.target.closeness * 50)
                  : selectedMetric === "Betweenness Centrality"
                  ? Math.max(10, link.target.betweenness * 80)
                  : selectedMetric === "Degree Centrality"
                  ? Math.max(10, link.target.degree * 80)
                  : 20);
              
              // Position label at 75% of the way to target, offset from the line
              const t = 0.75;
              const baseX = link.source.x + (dx * t);
              const baseY = link.source.y + (dy * t);
              
              // Create perpendicular offset for the label
              const offsetDistance = 15 / globalScale;
              const perpX = (-dy / distance) * offsetDistance;
              const perpY = (dx / distance) * offsetDistance;
              
              labelX = baseX + perpX;
              labelY = baseY + perpY;
            } else {
              // Fallback to midpoint if distance is 0
              labelX = (link.source.x + link.target.x) / 2;
              labelY = (link.source.y + link.target.y) / 2;
            }
          } else {
            // For undirected graphs, use the center as before
            labelX = (link.source.x + link.target.x) / 2;
            labelY = (link.source.y + link.target.y) / 2;
          }
          
          // Draw weight label
          const fontSize = 10 / globalScale;
          ctx.save();
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          ctx.fillStyle = "#333";
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // Draw text with white outline for better visibility
          ctx.strokeText(link.weight || "1", labelX, labelY);
          ctx.fillText(link.weight || "1", labelX, labelY);
          ctx.restore();

          if (isDirectedGraph) {
            const targetRadius =
              link.target.size ||
              (selectedMetric === "PageRank Centrality"
                ? Math.max(10, link.target.pagerank * 500)
                : selectedMetric === "Eigenvector Centrality"
                ? Math.max(10, link.target.eigenvector * 60)
                : selectedMetric === "Closeness Centrality"
                ? Math.max(10, link.target.closeness * 50)
                : selectedMetric === "Betweenness Centrality"
                ? Math.max(10, link.target.betweenness * 80)
                : selectedMetric === "Degree Centrality"
                ? Math.max(10, link.target.degree * 80)
                : 20);

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
            ctx.fillStyle = "gray";
            ctx.fill();
            ctx.restore();
          }
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const fontSize = 12 / globalScale;

          const radius =
            node.size ||
            (selectedMetric === "PageRank Centrality"
              ? Math.max(10, node.pagerank * 500)
              : selectedMetric === "Eigenvector Centrality"
              ? Math.max(10, node.eigenvector * 60)
              : selectedMetric === "Closeness Centrality"
              ? Math.max(10, node.closeness * 50)
              : selectedMetric === "Betweenness Centrality"
              ? Math.max(10, node.betweenness * 80)
              : selectedMetric === "Degree Centrality"
              ? Math.max(10, node.degree * 80)
              : 20);

          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

          const isHighlighted = node.highlighted && highlightCentralNodes;

          const nodeColor = isHighlighted
            ? "#ff9900"
            : node.color ||
              (selectedMetric === "PageRank Centrality"
                ? "orange"
                : selectedMetric === "Eigenvector Centrality"
                ? "purple"
                : selectedMetric === "Closeness Centrality"
                ? "green"
                : selectedMetric === "Betweenness Centrality"
                ? "red"
                : selectedMetric === "Degree Centrality"
                ? "#231d81"
                : "blue");

          ctx.fillStyle = nodeColor;
          ctx.fill();

          if (node.isHighlightedCommunity) {
            ctx.save();
            ctx.shadowColor = "#F5BD20";
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = "#F5BD20";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          } else if (isHighlighted) {
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "white";
          ctx.fillText(node.id, node.x, node.y);

          if (selectedMetric === "Degree Centrality") {
            ctx.fillStyle = "#231d81";
            ctx.fillText(`Deg: ${node.degree}`, node.x, node.y + radius + 5);
          }
          if (selectedMetric === "Betweenness Centrality") {
            ctx.fillStyle = "DarkRed";
            ctx.fillText(
              `Btw: ${node.betweenness?.toFixed(2) || 0}`,
              node.x,
              node.y + radius + 5
            );
          }
          if (selectedMetric === "Closeness Centrality") {
            ctx.fillStyle = "green";
            ctx.fillText(
              `Cls: ${node.closeness?.toFixed(2) || 0}`,
              node.x,
              node.y + radius + 5
            );
          }
          if (selectedMetric === "Eigenvector Centrality") {
            ctx.fillStyle = "purple";
            ctx.fillText(
              `Eig: ${node.eigenvector?.toFixed(4) || 0}`,
              node.x,
              node.y + radius + 5
            );
          }
          if (selectedMetric === "PageRank Centrality") {
            ctx.fillStyle = "orange";
            ctx.fillText(
              `PR: ${node.pagerank?.toFixed(4) || 0}`,
              node.x,
              node.y + radius + 5
            );
          }

          ctx.restore();
        }}
        onNodeHover={(node) => {
          if (node && networkWasRestored) {
            document.body.style.cursor = "pointer";
          } else {
            document.body.style.cursor = "default";
          }
        }}
      />
    </div>
  );
};

NetworkGraph.propTypes = {
  networkData: PropTypes.object,
  filteredNodes: PropTypes.array,
  filteredLinks: PropTypes.array,
  customizedNetworkData: PropTypes.object,
  selectedMetric: PropTypes.string,
  highlightCentralNodes: PropTypes.bool,
  showMetrics: PropTypes.bool,
  visualizationSettings: PropTypes.object,
  handleNodeClick: PropTypes.func,
  networkWasRestored: PropTypes.bool,
  forceGraphRef: PropTypes.object,
  isDirectedGraph: PropTypes.bool,
};

export default NetworkGraph;
