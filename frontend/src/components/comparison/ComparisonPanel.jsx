import React, { useState } from "react";
import { Button, Card, Row, Col } from "react-bootstrap";
import ComparisonItem from "./ComparisonItem";
import ComparisonMetrics from "./ComparisonMetrics";

const ComparisonPanel = ({
  originalNetworkData,
  comparisonFiles,
  comparisonData,
  comparisonNetworkData,
  activeComparisonIndices,
  filteredOriginalData,
  filteredComparisonData,
  onFileUpload,
  onAnalyzeNetwork,
  onToggleComparison,
  onApplyComparisonFilters,
  onResetComparisonFilters,
  addComparison,
  comparisonCount,
}) => {

  const handleAddComparison = () => {
    addComparison();
  };

  return (
    <Row className="mt-4">
      <Card className="comparison-card">
        <Card.Header>
          <h4 className="fw-bold">Comparison Section</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Button
                className="action-btn mt-3 mb-3"
                onClick={handleAddComparison}
              >
                Add New Comparison
              </Button>
            </Col>
          </Row>

          {[...Array(comparisonCount)].map((_, index) => (
            <ComparisonItem
              key={index}
              index={index}
              comparisonData={comparisonData[index]}
              onFileUpload={onFileUpload}
              onAnalyzeNetwork={onAnalyzeNetwork}
            />
          ))}

          <ComparisonMetrics
            originalNetworkData={originalNetworkData}
            comparisonNetworkData={comparisonNetworkData}
            comparisonData={comparisonData}
            activeComparisonIndices={activeComparisonIndices}
            filteredOriginalData={filteredOriginalData}
            filteredComparisonData={filteredComparisonData}
            onToggleComparison={onToggleComparison}
            onApplyComparisonFilters={onApplyComparisonFilters}
            onResetComparisonFilters={onResetComparisonFilters}
          />
        </Card.Body>
      </Card>
    </Row>
  );
};

export default ComparisonPanel;
