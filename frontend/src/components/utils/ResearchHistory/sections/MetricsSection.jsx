import React from 'react';
import { Button } from 'react-bootstrap';
import { graphMetrics } from "../../../../constants/graphMetrics";

const MetricsSection = ({
    selectedMetric,
    handleToggleMetric,
    highlightCentralNodes,
    handleHighlightCentralNodes
}) => {
    return (
        <div className="section-content">
            <div className="section-title">Network Metrics</div>
            <p className="text-muted mb-3">
                Select a metric to analyze node importance in the network
            </p>
            <div className="metrics-grid">
                {graphMetrics.map((metric) => (
                    <Button
                        key={metric}
                        variant="light"
                        className={`metric-btn mb-2 ${selectedMetric === metric ? "active" : ""}`}
                        onClick={() => handleToggleMetric(metric)}
                    >
                        {metric}
                    </Button>
                ))}
            </div>
            {selectedMetric && (
                <div className="metric-actions mt-3">
                    <Button
                        variant="light"
                        className={`btn-block mb-2 ${highlightCentralNodes ? "active" : ""}`}
                        onClick={handleHighlightCentralNodes}
                    >
                        {highlightCentralNodes ? "Clear Highlights" : "Highlight Top Nodes"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MetricsSection; 