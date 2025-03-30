import React, { useState } from "react";
import { Card, Button, Table } from "react-bootstrap";
import { ChevronUp, ChevronDown } from "react-bootstrap-icons";

const MetricsPanel = ({ networkStats }) => {
  const [showNetworkStats, setShowNetworkStats] = useState(false);
  
  const stats = networkStats || {};
  const numNodes = stats.numNodes || 0;
  const numEdges = stats.numEdges || 0;
  const reciprocity = stats.reciprocity || 0;
  const inDegreeMap = stats.inDegreeMap || {};
  const outDegreeMap = stats.outDegreeMap || {};
  
  const topNodeIds = Object.keys(inDegreeMap)
    .sort((a, b) => (inDegreeMap[b] || 0) - (inDegreeMap[a] || 0))
    .slice(0, 10);

  return (
    <Card className="metrics-card my-2">
      <h4 className="fw-bold d-flex justify-content-between align-items-center">
        Network Metrics
        <Button
          variant="link"
          className="metrics-toggle"
          onClick={() => setShowNetworkStats(!showNetworkStats)}
        >
          {showNetworkStats ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </Button>
      </h4>
      {showNetworkStats && (
        <div className="mt-2">
          <p>
            <strong>Nodes:</strong> {numNodes}
          </p>
          <p>
            <strong>Edges:</strong> {numEdges}
          </p>
          <p>
            <strong>Reciprocity:</strong> {reciprocity}
          </p>
          <h5 className="fw-bold mt-3">Top Nodes by Degree</h5>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Node ID</th>
                <th>In-Degree</th>
                <th>Out-Degree</th>
              </tr>
            </thead>
            <tbody>
              {topNodeIds.length > 0 ? (
                topNodeIds.map((nodeId) => (
                  <tr key={nodeId}>
                    <td>{nodeId}</td>
                    <td>{inDegreeMap[nodeId] || 0}</td>
                    <td>{outDegreeMap[nodeId] || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">No data available</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
};

export default MetricsPanel;