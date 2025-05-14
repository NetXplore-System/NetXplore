import React, { useState, useRef } from "react";
import { Card } from "react-bootstrap";
import ComparisonPanel from "../../components/comparison/ComparisonPanel";

const ComparativeAnalysis = ({ originalNetworkData, comparison, filters }) => {
  const [message, setMessage] = useState(""); 

  const {
    comparisonCount,
    comparisonFiles,
    comparisonData,
    comparisonNetworkData,
    activeComparisonIndices,
    filteredOriginalData,
    filteredComparisonData,
    addComparison,
    handleComparisonFileChange,
    toggleComparisonActive,
    analyzeComparisonNetwork,
    applyComparisonFilters,
    resetComparisonFilters,
  } = comparison;

  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Comparative Analysis</h3>

        <p className="text-muted mb-4">
          Compare the current network to other networks to identify patterns,
          changes, and differences. Upload comparison files to analyze alongside
          your main network.
        </p>

        <ComparisonPanel
          originalNetworkData={originalNetworkData}
          comparisonFiles={comparisonFiles}
          comparisonData={comparisonData}
          comparisonNetworkData={comparisonNetworkData}
          activeComparisonIndices={activeComparisonIndices}
          filteredOriginalData={filteredOriginalData}
          filteredComparisonData={filteredComparisonData}
          onFileUpload={handleComparisonFileChange}
          onAnalyzeNetwork={(index) => {
            analyzeComparisonNetwork(
              index,
              filters.buildNetworkFilterParams()
            ).then((result) => {
              if (result && result.message) {
                setMessage(result.message);
              }
            });
          }}
          onToggleComparison={toggleComparisonActive}
          onApplyComparisonFilters={(filterParams) => {
            const filtersWithNetworkParams = {
              ...filterParams,
              networkFilterParams: filters.buildNetworkFilterParams(),
            };

            applyComparisonFilters(filtersWithNetworkParams).then((result) => {
              if (result && result.message) {
                setMessage(result.message);
              }
            });
          }}
          onResetComparisonFilters={resetComparisonFilters}
          addComparison={addComparison}
          comparisonCount={comparisonCount}
        />

        {message && <div className="alert alert-info mt-3">{message}</div>}
      </Card.Body>
    </Card>
  );
};

export default ComparativeAnalysis;
