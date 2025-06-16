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

  useEffect(() => {
    if (forceGraphRef.current && networkData && networkData.nodes) {
      const graph = forceGraphRef.current;
      const nodes = customizedNetworkData ? customizedNetworkData.nodes : filteredNodes;
      const nodeCount = nodes.length;
            
      setTimeout(() => {
        if (graph) {
          try {
            if (typeof graph.d3Force === 'function') {
              
              const chargeForce = graph.d3Force('charge');
              if (chargeForce && typeof chargeForce.strength === 'function') {
                chargeForce.strength(-150 * nodeCount);
              }
              
              const linkForce = graph.d3Force('link');
              if (linkForce && typeof linkForce.distance === 'function') {
                 linkForce.distance(20 + nodeCount * 0.5);



              }
              
              if (typeof graph.d3ReheatSimulation === 'function') {
                graph.d3ReheatSimulation();
              }
              
            } else {
              console.warn('d3Force is not a function on the graph instance');}
          } catch (error) {
            console.error('Error setting forces:', error);}
        }
      }, 300);
    }
  }, [networkData, customizedNetworkData, selectedMetric]);

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
        fitViewPadding={100}     
        nodeAutoColorBy={customizedNetworkData ? null : "id"}
        linkWidth={(link) => Math.sqrt(link.weight || 1)}
        linkColor={() => "gray"}
        enableNodeDrag={true}
        cooldownTicks={400} 
        d3AlphaDecay={0.005} 
        d3VelocityDecay={0.7} 
        d3ReheatOnLayout={true}
        onNodeClick={handleNodeClick}
        onEngineStop={() => forceGraphRef.current?.zoomToFit(400, 100)}
        onNodeDragEnd={(node) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        linkCanvasObject={(link, ctx, globalScale) => {
          if (!link.source || !link.target) return;
45
          const sourceX = link.source.x;
          const sourceY = link.source.y;
          const targetX = link.target.x;
          const targetY = link.target.y;

          const dx = targetX - sourceX;
          const dy = targetY - sourceY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return;

          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.lineTo(targetX, targetY);
          ctx.strokeStyle = "gray";
          ctx.lineWidth = Math.sqrt(link.weight || 1);
          ctx.stroke();

          if (isDirectedGraph) {
            // Reduced arrowhead size
            const minArrowLength = 5;
            const minArrowWidth = 2.5;
            const arrowLength = Math.max(minArrowLength, 8 / globalScale);
            const arrowWidth = Math.max(minArrowWidth, 4 / globalScale);
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

            // Arrowhead tip
            const arrowTipX = targetX - (dx * targetRadius) / dist;
            const arrowTipY = targetY - (dy * targetRadius) / dist;
            const angle = Math.atan2(dy, dx);
            const arrowAngle = Math.PI / 8;
            const arrowX1 = arrowTipX - arrowLength * Math.cos(angle - arrowAngle);
            const arrowY1 = arrowTipY - arrowLength * Math.sin(angle - arrowAngle);
            const arrowX2 = arrowTipX - arrowLength * Math.cos(angle + arrowAngle);
            const arrowY2 = arrowTipY - arrowLength * Math.sin(angle + arrowAngle);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(arrowTipX, arrowTipY);
            ctx.lineTo(arrowX1, arrowY1);
            ctx.lineTo(arrowX2, arrowY2);
            ctx.closePath();
            ctx.fillStyle = "gray";
            ctx.fill();
            ctx.restore();

            // Place label just before the arrowhead, on the line
            const labelDistFromTip = arrowLength + 6; // px before arrow tip
            let labelX = arrowTipX - (dx / dist) * labelDistFromTip;
            let labelY = arrowTipY - (dy / dist) * labelDistFromTip;
            // Optionally, offset slightly perpendicular for clarity
            const perpX = -dy / dist;
            const perpY = dx / dist;
            labelX += perpX * 2; // small offset
            labelY += perpY * 2;

            const fontSize = 10 / globalScale;
            ctx.save();
            ctx.font = `bold ${fontSize}px Sans-Serif`;
            ctx.fillStyle = "#333";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeText(link.weight || "1", labelX, labelY);
            ctx.fillText(link.weight || "1", labelX, labelY);
            ctx.restore();
          } else {
            // Undirected: label at midpoint
            const labelX = (sourceX + targetX) / 2;
            const labelY = (sourceY + targetY) / 2;
            const fontSize = 10 / globalScale;
            ctx.save();
            ctx.font = `bold ${fontSize}px Sans-Serif`;
            ctx.fillStyle = "#333";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeText(link.weight || "1", labelX, labelY);
            ctx.fillText(link.weight || "1", labelX, labelY);
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