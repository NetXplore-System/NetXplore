import React from "react";
import { Button } from "react-bootstrap";

const MetricsButton = ({ graphMetrics, selectedMetric, onToggleMetric }) => {
  return (
    <div className="mt-2">
      {graphMetrics.map((metric) => (
        <Button
          key={metric}
          className={`metrics-item ${
            selectedMetric === metric ? "active" : ""
          }`}
          onClick={() => onToggleMetric(metric)}
        >
          {metric}
        </Button>
      ))}
    </div>
  );
};

export default MetricsButton;
