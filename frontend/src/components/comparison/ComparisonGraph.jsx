import { ForceGraph2D } from "react-force-graph";
import { Card, Button } from "react-bootstrap";
import React, { useState, useRef, useMemo, useCallback } from "react";
import "../../styles/ComparativeAnalysis.css";

const ComparisonGraph = ({
  graphData,
  title,
  width = 600,
  height = 500,
  isComparisonGraph = false,
  selectedMetric = null,
  comparisonMetrics = [],
  buttonElement = null,
  graphIndex = 0,
  directed = false,
}) => {
  const [nodesFixed, setNodesFixed] = useState(false);
  const forceGraphRef = useRef(null);
  const [nodeColorsMap] = useState(new Map());

  if (!graphData || !graphData.nodes || !graphData.links) {
    return <div>No graph data available</div>;
  }

  const colorPalettes = useMemo(
    () => [
      { base: "#050d2d", gradient: "#4361ee", links: "rgba(67, 97, 238, 0.6)" },
      {
        base: "#7209b7",
        gradient: "#f72585",
        links: "rgba(242, 37, 133, 0.6)",
      },
      { base: "#d00000", gradient: "#ffba08", links: "rgba(255, 186, 8, 0.6)" },
      { base: "#1e6091", gradient: "#38b000", links: "rgba(56, 176, 0, 0.6)" },
      { base: "#6a4c93", gradient: "#ff9e00", links: "rgba(255, 158, 0, 0.6)" },
      {
        base: "#10002b",
        gradient: "#e0aaff",
        links: "rgba(224, 170, 255, 0.6)",
      },
      {
        base: "#001219",
        gradient: "#94d2bd",
        links: "rgba(148, 210, 189, 0.6)",
      },
      {
        base: "#590d22",
        gradient: "#ee964b",
        links: "rgba(238, 150, 75, 0.6)",
      },
    ],
    []
  );

  const currentPalette = useMemo(() => {
    const index = isComparisonGraph ? graphIndex % colorPalettes.length : 0;
    return colorPalettes[index];
  }, [graphIndex, colorPalettes, isComparisonGraph]);

  const metricsColorMap = useMemo(
    () => ({
      "Degree Centrality": {
        color: "#231d81",
        scaleFactor: 80,
        abbreviation: "Deg",
      },
      "Betweenness Centrality": {
        color: "#d00000",
        scaleFactor: 80,
        abbreviation: "Btw",
      },
      "Closeness Centrality": {
        color: "#38b000",
        scaleFactor: 50,
        abbreviation: "Cls",
      },
      "Eigenvector Centrality": {
        color: "#7209b7",
        scaleFactor: 60,
        abbreviation: "Eig",
      },
      "PageRank Centrality": {
        color: "#ff9e00",
        scaleFactor: 500,
        abbreviation: "PR",
      },
    }),
    []
  );

  const deterministicRandom = (id, salt = "") => {
    const str = id.toString() + salt + graphIndex.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; 
    }
    return Math.abs((hash % 1000) / 1000);
  };

  const getNodeColor = useCallback(
    (node, factor = 1) => {
      const nodeId = node.id ? node.id.toString() : "";

      const cacheKey = `${nodeId}-${isComparisonGraph}-${graphIndex}-${factor}`;
      if (nodeColorsMap.has(cacheKey)) {
        return nodeColorsMap.get(cacheKey);
      }

      if (!isComparisonGraph) {
        const baseColor = "#050d2d";
        nodeColorsMap.set(cacheKey, baseColor);
        return baseColor;
      }

      const palette = currentPalette;
      const startColor = hexToRgb(palette.base);
      const endColor = hexToRgb(palette.gradient);
      let t = deterministicRandom(nodeId, "color") * 0.6 + 0.2;

      if (node.degree) {
        const normalizedDegree = Math.min(node.degree / 10, 1);
        t = (t + normalizedDegree) / 2;
      }

      const r = Math.floor(startColor.r * (1 - t) + endColor.r * t);
      const g = Math.floor(startColor.g * (1 - t) + endColor.g * t);
      const b = Math.floor(startColor.b * (1 - t) + endColor.b * t);

      const color = `rgba(${r}, ${g}, ${b}, ${factor})`;
      nodeColorsMap.set(cacheKey, color);
      return color;
    },
    [currentPalette, graphIndex, isComparisonGraph, nodeColorsMap]
  );

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const processedData = useMemo(() => {
    const nodes = graphData.nodes.map((node) => {
      return {
        ...node,
        _color: getNodeColor(node),
      };
    });

    const links = graphData.links.map((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);

      return {
        ...link,
        source: sourceNode || sourceId,
        target: targetNode || targetId,
      };
    });

    return { nodes, links };
  }, [graphData, getNodeColor]);

  const unfixAllNodes = () => {
    if (processedData && processedData.nodes) {
      const hasFixedNodes = processedData.nodes.some(
        (node) => node.fx !== null || node.fy !== null
      );

      if (hasFixedNodes) {
        processedData.nodes.forEach((node) => {
          node.fx = null;
          node.fy = null;
        });

        if (forceGraphRef.current) {
          forceGraphRef.current.d3ReheatSimulation();
        }

        setNodesFixed(false);
      }
    }
  };

  const getNodeMetricInfo = useCallback(
    (node, metrics) => {
      if (!metrics || metrics.length === 0) {
        return {
          size: 20,
          color:
            node._color || (isComparisonGraph ? getNodeColor(node) : "#050d2d"),
          label: "",
        };
      }

      const metric = metrics[0];
      const metricInfo = metricsColorMap[metric];

      if (!metricInfo) {
        return {
          size: 20,
          color:
            node._color || (isComparisonGraph ? getNodeColor(node) : "#050d2d"),
          label: "",
        };
      }

      let nodeValue;
      let nodeSize;

      switch (metric) {
        case "Degree Centrality":
          nodeValue = node.degree || 0;
          break;
        case "Betweenness Centrality":
          nodeValue = node.betweenness || 0;
          break;
        case "Closeness Centrality":
          nodeValue = node.closeness || 0;
          break;
        case "Eigenvector Centrality":
          nodeValue = node.eigenvector || 0;
          break;
        case "PageRank Centrality":
          nodeValue = node.pagerank || 0;
          break;
        default:
          nodeValue = 0;
      }

      nodeSize = Math.max(10, nodeValue * metricInfo.scaleFactor);

      const label = `${metricInfo.abbreviation}: ${
        typeof nodeValue === "number" && nodeValue < 0.01
          ? nodeValue.toFixed(4)
          : typeof nodeValue === "number" && nodeValue < 1
          ? nodeValue.toFixed(2)
          : nodeValue
      }`;

      const color = isComparisonGraph
        ? node._color ||
          getNodeColor(node, 0.5 + Math.min(nodeValue * 2, 1) * 0.5)
        : metricInfo.color;

      return {
        size: nodeSize,
        color,
        label,
        value: nodeValue,
        metricColor: metricInfo.color,
      };
    },
    [metricsColorMap, isComparisonGraph, getNodeColor]
  );

  const nodeCanvasObjectCallback = useCallback(
    (node, ctx, globalScale) => {
      const fontSize = 12 / globalScale;

      const metricInfo = getNodeMetricInfo(
        node,
        comparisonMetrics.length > 0
          ? comparisonMetrics
          : selectedMetric
          ? [selectedMetric]
          : []
      );

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, metricInfo.size, 0, 2 * Math.PI, false);
      ctx.fillStyle = metricInfo.color;
      ctx.fill();

      if (
        metricInfo.metricColor &&
        (comparisonMetrics.length > 0 || selectedMetric)
      ) {
        ctx.strokeStyle = metricInfo.metricColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText(node.id, node.x, node.y);

      if (metricInfo.label) {
        ctx.fillStyle =
          comparisonMetrics.length > 0 || selectedMetric
            ? metricsColorMap[comparisonMetrics[0] || selectedMetric]?.color ||
              "#050d2d"
            : "#050d2d";

        ctx.fillText(metricInfo.label, node.x, node.y + metricInfo.size + 5);
      }

      ctx.restore();
    },
    [getNodeMetricInfo, comparisonMetrics, selectedMetric, metricsColorMap]
  );

  return (
    <div className="graph-visualization">
      {title && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">
            {title}
            {isComparisonGraph && (
              <span
                className="color-indicator"
                style={{
                  background: `linear-gradient(45deg, ${currentPalette.base}, ${currentPalette.gradient})`,
                  display: "inline-block",
                  width: "20px",
                  height: "10px",
                  borderRadius: "2px",
                  marginLeft: "8px",
                  verticalAlign: "middle",
                }}
              ></span>
            )}
          </h6>
          {nodesFixed && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={unfixAllNodes}
            >
              Release Nodes
            </Button>
          )}
        </div>
      )}

      <div className="graph-container">
        {buttonElement}
        <ForceGraph2D
          ref={forceGraphRef}
          graphData={processedData}
          width={width}
          height={height}
          cooldownTicks={100}
          warmupTicks={50}
          fitView
          fitViewPadding={20}
          onNodeDragEnd={(node) => {
            node.fx = node.x;
            node.fy = node.y;
            setNodesFixed(true);
          }}
          linkWidth={(link) => Math.sqrt(link.weight || 1)}
          linkColor={() =>
            isComparisonGraph
              ? currentPalette.links
              : "rgba(128, 128, 128, 0.6)"
          }
          nodeCanvasObject={nodeCanvasObjectCallback}
          linkCanvasObject={(link, ctx, globalScale) => {
            if (!link.source || !link.target) return;

            const sourceX =
              typeof link.source.x === "number" ? link.source.x : 0;
            const sourceY =
              typeof link.source.y === "number" ? link.source.y : 0;
            const targetX =
              typeof link.target.x === "number" ? link.target.x : 0;
            const targetY =
              typeof link.target.y === "number" ? link.target.y : 0;

            if (
              sourceX === 0 &&
              sourceY === 0 &&
              targetX === 0 &&
              targetY === 0
            )
              return;

            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length === 0) return;

            // Draw the link line
            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = isComparisonGraph
              ? currentPalette.links
              : "rgba(128, 128, 128, 0.6)";
            ctx.lineWidth = Math.sqrt(link.weight || 1);
            ctx.stroke();

            // Draw arrow if directed
            if (directed) {
              const arrowLength = 6;
              
              // Calculate arrow position at the edge of the target node
              const nodeRadius = 22; // Approximate node radius
              const arrowTipX = targetX - (dx / length) * nodeRadius;
              const arrowTipY = targetY - (dy / length) * nodeRadius;
              
              // Arrow head - make it more pointed with narrower angle
              const angle = Math.atan2(dy, dx);
              const arrowAngle = Math.PI / 8; // Narrower arrow angle for smaller head
              const arrowX1 = arrowTipX - arrowLength * Math.cos(angle - arrowAngle);
              const arrowY1 = arrowTipY - arrowLength * Math.sin(angle - arrowAngle);
              const arrowX2 = arrowTipX - arrowLength * Math.cos(angle + arrowAngle);
              const arrowY2 = arrowTipY - arrowLength * Math.sin(angle + arrowAngle);

              ctx.beginPath();
              ctx.moveTo(arrowTipX, arrowTipY);
              ctx.lineTo(arrowX1, arrowY1);
              ctx.lineTo(arrowX2, arrowY2);
              ctx.closePath();
              
              // Fill the arrow for better visibility
              ctx.fillStyle = isComparisonGraph
                ? currentPalette.links.replace('0.6', '1')
                : "rgba(128, 128, 128, 1)";
              ctx.fill();
              
              // Also stroke the arrow
              ctx.strokeStyle = isComparisonGraph
                ? currentPalette.links.replace('0.6', '1')
                : "rgba(128, 128, 128, 1)";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Position weight label close to target node
            let labelX, labelY;
            if (directed) {
              // Position weight at the arrow head location
              const nodeRadius = 22; // Same as arrow positioning
              const arrowTipX = targetX - (dx / length) * nodeRadius;
              const arrowTipY = targetY - (dy / length) * nodeRadius;
              
              // Position label at arrow tip with small perpendicular offset
              labelX = arrowTipX;
              labelY = arrowTipY;
              
              // Add small perpendicular offset to avoid overlapping with arrow
              const perpX = -dy / length;
              const perpY = dx / length;
              labelX += perpX * 8;
              labelY += perpY * 8;
            } else {
              // Position weight at midpoint for undirected graphs
              labelX = (sourceX + targetX) / 2;
              labelY = (sourceY + targetY) / 2;
            }

            // Draw weight label with white text outline (no background square)
            const fontSize = 11 / globalScale;
            const weightText = (link.weight || "1").toString();
            
            ctx.save();
            ctx.font = `bold ${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Draw white outline for better visibility
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.strokeText(weightText, labelX, labelY);
            
            // Draw black text on top
            ctx.fillStyle = "black";
            ctx.fillText(weightText, labelX, labelY);
            ctx.restore();
          }}
        />
      </div>
    </div>
  );
};

export default ComparisonGraph;
