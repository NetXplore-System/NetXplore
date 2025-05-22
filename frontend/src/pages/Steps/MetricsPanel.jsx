import React from "react";
import { Card } from "react-bootstrap";

const MetricsPanel = ({ networkStats }) => {
  if (!networkStats) return null;

  return (
    <Card className="stats-card mt-3">
      <h4 className="fw-bold">Network Statistics</h4>
      <div className="stats-content">
        <p>
          <strong>Nodes:</strong> {networkStats.numNodes}
        </p>
        <p>
          <strong>Links:</strong> {networkStats.numEdges}
        </p>
        <p>
          <strong>Reciprocity:</strong> {networkStats.reciprocity}
        </p>

        <div className="mt-3">
          <h5>Top Nodes by Degree:</h5>
          <ul className="list-unstyled">
            {Object.entries(networkStats.outDegreeMap || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([nodeId, degree]) => (
                <li key={nodeId}>
                  <strong>{nodeId}:</strong> {degree}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default MetricsPanel;
