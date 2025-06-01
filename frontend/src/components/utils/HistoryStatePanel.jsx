import { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { ChevronUp, ChevronDown } from "react-bootstrap-icons";

const HistoryMetricsPanel = ({ networkStats}) => {
  const [showNetworkStats, setShowNetworkStats] = useState(false);

  const {
    numNodes = 0,
    numEdges = 0,
    reciprocity = 0,
    communities,
    diameter = 0
  } = networkStats || {};

  const avgDegree = numNodes > 0 ? (numEdges * 2 / numNodes).toFixed(2) : 0;
  const density = numNodes > 1 ? ((numEdges / ((numNodes * (numNodes - 1)) / 2)) * 100).toFixed(2) : 0;
  
  const stats = [
    {
      label: "Total Nodes",
      value: numNodes.toLocaleString(),
      icon: "N",
      className: "nodes-stat",
      description: "Number of users in the network"
    },
    {
      label: "Total Edges", 
      value: numEdges.toLocaleString(),
      icon: "E",
      className: "edges-stat",
      description: "Number of connections between users"
    },
    {
      label: "Network Density",
      value: `${density}%`,
      icon: "D",
      className: "density-stat",
      description: "How connected the network is"
    },
    {
      label: "Average Degree",
      value: avgDegree,
      icon: "Δ",
      className: "reciprocity-stat",
      description: "Average connections per user"
    },
    {
      label: "Reciprocity",
      value: `${reciprocity}%`,
      icon: "R",
      className: "reciprocity-stat",
      description: "Percentage of mutual connections"
    },
    {
      label: "Communities",
      value: communities?.toLocaleString() || "0",
      icon: "C",
      className: "communities-stat",
      description: "Number of detected communities"
    },
    {
      label: "Diameter",
      value: diameter,
      icon: "⌀",
      className: "diameter-stat",
      description: "Longest shortest path in the network"
    }
  ];

  if (!networkStats || numNodes === 0) {
    return (
      <Card className="border-0 bg-light">
        <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Network Statistics</h6>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowNetworkStats(!showNetworkStats)}
            className="text-white p-0"
          >
            {showNetworkStats ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </Card.Header>
        {showNetworkStats && (
          <Card.Body className="text-center py-4">
            <p className="text-muted mb-0">No network data available</p>
          </Card.Body>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-0">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Network Statistics</h6>
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowNetworkStats(!showNetworkStats)}
          className="p-0 text-dark"
        >
          {showNetworkStats ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </Card.Header>
      {showNetworkStats && (
        <Card.Body>
          <div className="metrics-stats-grid">
            {stats.map((stat) => (
              <div 
                key={stat.label}
                className={`network-stat-item ${stat.className}`}
                title={stat.description}
              >
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">
                  <span className="stat-icon">{stat.icon}</span>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      )}
    </Card>
  );
};

export default HistoryMetricsPanel;
