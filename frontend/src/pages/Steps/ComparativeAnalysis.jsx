import React, { useState, useEffect } from "react";
import {
  Card,
  Alert,
  Button,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  FileBarGraph,
  PlusCircle,
  GraphUp,
  ArrowsFullscreen,
  ArrowsCollapse,
  InfoCircle,
} from "react-bootstrap-icons";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import ComparisonItem from "../../components/comparison/ComparisonItem";
import ComparisonMetrics from "../../components/comparison/ComparisonMetrics";
import "../../styles/ComparativeAnalysis.css";

const ComparativeAnalysis = ({ originalNetworkData, comparison, filters }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [expandedView, setExpandedView] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [localFilterSettings, setLocalFilterSettings] = useState([]);
  const [comparisonMetrics, setComparisonMetrics] = useState([]);

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
    updateComparisonFilterSettings,
  } = comparison;

  const graphMetrics = [
    "Degree Centrality",
    "Betweenness Centrality",
    "Closeness Centrality",
    "Eigenvector Centrality",
    "PageRank Centrality",
  ];

  useEffect(() => {
    if (comparisonCount > localFilterSettings.length) {
      const newFilterSettings = [...localFilterSettings];
      for (let i = localFilterSettings.length; i < comparisonCount; i++) {
        newFilterSettings.push({
          timeFrame: {
            startDate: "",
            endDate: "",
            startTime: "",
            endTime: "",
          },
          limit: {
            enabled: true,
            count: 50,
            fromEnd: false,
            type: "messages",
          },
        });
      }
      setLocalFilterSettings(newFilterSettings);
    }
  }, [comparisonCount]);

  const buildFilterParamsFromSettings = (filterSettings) => {
    const params = new URLSearchParams();
    if (filterSettings.timeFrame) {
      if (filterSettings.timeFrame.startDate)
        params.append("startDate", filterSettings.timeFrame.startDate);
      if (filterSettings.timeFrame.endDate)
        params.append("endDate", filterSettings.timeFrame.endDate);
      if (filterSettings.timeFrame.startTime)
        params.append("startTime", filterSettings.timeFrame.startTime);
      if (filterSettings.timeFrame.endTime)
        params.append("endTime", filterSettings.timeFrame.endTime);
    }
    if (filterSettings.limit && filterSettings.limit.enabled) {
      params.append("limitMessages", "true");
      params.append("messageCount", filterSettings.limit.count.toString());
      params.append("fromEnd", filterSettings.limit.fromEnd.toString());
      params.append("limitType", filterSettings.limit.type);
    }
    return params;
  };

  const handleFilterChange = (index, newFilters) => {
    const updatedFilterSettings = [...localFilterSettings];
    updatedFilterSettings[index] = newFilters;
    setLocalFilterSettings(updatedFilterSettings);
    checkActiveFilters(index, newFilters);
  };

  const checkActiveFilters = (index, filters) => {
    const hasTimeFrame =
      filters.timeFrame?.startDate ||
      filters.timeFrame?.endDate ||
      filters.timeFrame?.startTime ||
      filters.timeFrame?.endTime;
    const hasLimit = filters.limit?.enabled;
    const isActive = hasTimeFrame || hasLimit;
    setActiveFilters((prev) => ({
      ...prev,
      [index]: isActive,
    }));
  };

  const handleAnalyzeNetwork = (index, itemFilters) => {
    setIsAnalyzing(true);
    return analyzeComparisonNetwork(index, null, itemFilters)
      .then((result) => {
        if (result && result.success) {
          setMessage(result.message || "Network analyzed successfully");
          toast.success(result.message || "Network analyzed successfully");
          updateComparisonFilterSettings(index, itemFilters);
          return applyComparisonFilters({
            comparisonMetrics,
          });
        } else {
          toast.error(result.message || "Analysis failed");
        }
        return result;
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  };

  const handleAddComparison = () => {
    addComparison();
    toast.success("New comparison item added");
  };

  const toggleComparisonMetric = (metric) => {
    setComparisonMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };


  const handleResetVisualizationFilters = () => {
    setComparisonMetrics([]);
    if (resetComparisonFilters) {
      resetComparisonFilters();
      toast.success("Visualization filters reset");
    }
  };

  const getActiveFilterCount = (index) => {
    const filters = localFilterSettings[index];
    if (!filters) return 0;
    let count = 0;
    if (filters.timeFrame?.startDate) count++;
    if (filters.timeFrame?.endDate) count++;
    if (filters.timeFrame?.startTime) count++;
    if (filters.timeFrame?.endTime) count++;
    if (filters.limit?.enabled) count++;
    return count;
  };

  const toggleExpandedView = () => {
    setExpandedView(!expandedView);
  };

  return (
    <Card className="research-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h3 className="step-title">Comparative Analysis</h3>
            <p className="text-muted">
              Compare your current network with other networks to identify
              patterns, changes, and differences over time.
            </p>
          </div>
        </div>

        <Alert variant="info" className="d-flex align-items-start mb-4">
          <InfoCircle size={20} className="me-2 mt-1" />
          <div>
            <strong>Pro tip:</strong> For time-series analysis, upload the same
            dataset multiple times with different time filters to compare
            network evolution over time.
          </div>
        </Alert>

        <div className={`comparison-section ${expandedView ? "expanded" : ""}`}>
          <div className="section-header d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              <FileBarGraph className="me-2" /> Comparison Files
            </h4>
            <Button
              variant="primary"
              className="btn-with-icon"
              onClick={handleAddComparison}
            >
              <PlusCircle className="me-1" /> Add Comparison
            </Button>
          </div>

          {comparisonCount === 0 ? (
            <Alert variant="light" className="text-center py-4">
              <div className="mb-3">
                <FileBarGraph size={32} className="text-secondary" />
              </div>
              <h5>No comparison files added yet</h5>
              <p className="text-muted mb-3">
                Add a comparison file to start analyzing differences between
                networks
              </p>
              <Button variant="primary" onClick={handleAddComparison}>
                <PlusCircle className="me-2" /> Add Comparison File
              </Button>
            </Alert>
          ) : (
            <div className="comparison-files-container">
              {[...Array(comparisonCount)].map((_, index) => (
                <ComparisonItem
                  key={index}
                  index={index}
                  comparisonData={comparisonData[index]}
                  comparisonFile={comparisonFiles[index]}
                  filterSettings={localFilterSettings[index]}
                  onFileUpload={(e) => handleComparisonFileChange(e, index)}
                  onAnalyzeNetwork={(index, filters) =>
                    handleAnalyzeNetwork(index, filters)
                  }
                  onFilterChange={handleFilterChange}
                  isActive={activeComparisonIndices.includes(index)}
                  onToggleActive={() => toggleComparisonActive(index)}
                  isAnalyzing={isAnalyzing}
                  activeFilterCount={getActiveFilterCount(index)}
                  hasActiveFilters={activeFilters[index]}
                />
              ))}
            </div>
          )}
        </div>

        {activeComparisonIndices.length > 0 && originalNetworkData ? (
          <div className="mt-4">
            <div className="section-header mb-3">
              <h4 className="mb-0">
                <GraphUp className="me-2" /> Network Comparison Visualization
              </h4>
            </div>
            <ComparisonMetrics
              originalNetworkData={originalNetworkData}
              comparisonNetworkData={comparisonNetworkData}
              comparisonData={comparisonData}
              activeComparisonIndices={activeComparisonIndices}
              onToggleComparison={toggleComparisonActive}
              filteredOriginalData={filteredOriginalData}
              filteredComparisonData={filteredComparisonData}
              onResetComparisonFilters={resetComparisonFilters}
            />
          </div>
        ) : (
          <Alert variant="light" className="text-center py-4 mt-4">
            <div className="mb-3">
              <GraphUp size={40} className="text-secondary" />
            </div>
            <h5>No active comparisons to visualize</h5>
            <p className="text-muted mb-3">
              {comparisonCount === 0
                ? "Add and analyze comparison files first"
                : "Analyze files and mark them as active for comparison"}
            </p>
          </Alert>
        )}

        {message && <div className="alert alert-info mt-3">{message}</div>}
      </Card.Body>
    </Card>
  );
};

export default ComparativeAnalysis;
