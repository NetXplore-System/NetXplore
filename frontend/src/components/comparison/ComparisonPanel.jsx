import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Tabs,
  Tab,
  Alert,
  Badge,
  Form,
} from "react-bootstrap";
import ComparisonItem from "./ComparisonItem";
import ComparisonMetrics from "./ComparisonMetrics";
import {
  BarChart,
  FileEarmark,
  ArrowsFullscreen,
  ArrowsCollapse,
  PlusCircle,
  FileBarGraph,
  InfoCircle,
} from "react-bootstrap-icons";
import { toast } from "sonner";

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
  filterSettings = [],
  onFilterChange,
}) => {
  const [activeTab, setActiveTab] = useState("files");
  const [expandedView, setExpandedView] = useState(false);
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [localFilterSettings, setLocalFilterSettings] = useState([]);

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

  const handleAddComparison = () => {
    addComparison();
    toast.success("New comparison item added");
  };

  const handleAnalyzeNetwork = (index, itemFilters) => {
    setIsAnalyzing(true);

    return onAnalyzeNetwork(index, itemFilters)
      .then((result) => {
        if (result && result.success) {
          setMessage(result.message || "Network analyzed successfully");
          toast.success(result.message || "Network analyzed successfully");
        } else {
          toast.error(result.message || "Analysis failed");
        }
        return result;
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  };

  const handleFilterChange = (index, newFilters) => {
    const updatedFilterSettings = [...localFilterSettings];
    updatedFilterSettings[index] = newFilters;
    setLocalFilterSettings(updatedFilterSettings);

    checkActiveFilters(index, newFilters);

    if (onFilterChange) {
      onFilterChange(index, newFilters);
    }
  };

  const checkActiveFilters = (index, filters) => {
    const hasTimeFrame =
      filters.timeFrame?.startDate ||
      filters.timeFrame?.endDate ||
      filters.timeFrame?.startTime ||
      filters.timeFrame?.endTime;

    const hasLimit = filters.limit?.enabled;

    const hasMessageCriteria =
      filters.messageCriteria?.minLength > 1 ||
      filters.messageCriteria?.maxLength ||
      filters.messageCriteria?.keywords ||
      filters.messageCriteria?.contentFilter;

    const hasUserFilters =
      filters.userFilters?.minMessages > 1 ||
      filters.userFilters?.maxMessages ||
      filters.userFilters?.usernameFilter;

    const isActive =
      hasTimeFrame || hasLimit || hasMessageCriteria || hasUserFilters;

    setActiveFilters((prev) => ({
      ...prev,
      [index]: isActive,
    }));
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
    <Card className={`comparison-card ${expandedView ? "expanded-view" : ""}`}>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">Network Comparison Analysis</h4>
          <Button
            variant="link"
            className="p-0 text-muted"
            onClick={toggleExpandedView}
            title={expandedView ? "Collapse view" : "Expand view"}
          >
            {expandedView ? (
              <ArrowsCollapse size={20} />
            ) : (
              <ArrowsFullscreen size={20} />
            )}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="d-flex align-items-start mb-4">
          <InfoCircle size={20} className="me-2 mt-1" />
          <div>
            <strong>Pro tip:</strong> For time-series analysis, upload the same
            dataset multiple times with different time filters to compare
            network evolution over time.
          </div>
        </Alert>

        <Tabs
          activeKey={activeTab}
          onSelect={(key) => setActiveTab(key)}
          className="mb-4 comparison-tabs"
        >
          <Tab
            eventKey="files"
            title={
              <>
                <FileEarmark className="me-2" /> Comparison Files
                {comparisonCount > 0 && (
                  <Badge bg="primary" className="ms-2">
                    {comparisonCount}
                  </Badge>
                )}
              </>
            }
          >
            <Row>
              <Col md={6}>
                <Button
                  className="action-btn mt-3 mb-3"
                  onClick={handleAddComparison}
                >
                  <PlusCircle className="me-2" /> Add New Comparison File
                </Button>
              </Col>
              {comparisonCount > 0 && (
                <Col md={6} className="text-end mt-3 mb-3">
                  <Alert
                    variant="info"
                    className="py-2 px-3 d-inline-block mb-0"
                  >
                    {activeComparisonIndices.length} of {comparisonCount} files
                    active for comparison
                  </Alert>
                </Col>
              )}
            </Row>

            {[...Array(comparisonCount)].map((_, index) => (
              <ComparisonItem
                key={index}
                index={index}
                comparisonData={comparisonData[index]}
                comparisonFile={comparisonFiles[index]}
                filterSettings={
                  localFilterSettings[index] || filterSettings[index]
                }
                onFileUpload={onFileUpload}
                onAnalyzeNetwork={(index, filters) =>
                  handleAnalyzeNetwork(index, filters)
                }
                onFilterChange={handleFilterChange}
                isActive={activeComparisonIndices.includes(index)}
                onToggleActive={() => onToggleComparison(index)}
                isAnalyzing={isAnalyzing}
                activeFilterCount={getActiveFilterCount(index)}
                hasActiveFilters={activeFilters[index]}
              />
            ))}

            {comparisonCount === 0 && (
              <Alert variant="light" className="text-center py-4 my-4">
                <div className="mb-3">
                  <FileBarGraph size={40} className="text-secondary" />
                </div>
                <h5>No comparison files added yet</h5>
                <p className="text-muted">
                  Click "Add New Comparison File" to begin comparing networks
                </p>
              </Alert>
            )}
          </Tab>

          <Tab
            eventKey="visualization"
            title={
              <>
                <BarChart className="me-2" /> Visualization & Results
              </>
            }
          >
            {activeComparisonIndices.length > 0 && originalNetworkData ? (
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
            ) : (
              <Alert variant="light" className="text-center py-4 my-4">
                <div className="mb-3">
                  <BarChart size={40} className="text-secondary" />
                </div>
                <h5>No active comparisons to visualize</h5>
                <p className="text-muted">
                  {comparisonCount === 0
                    ? "Add and analyze comparison files first"
                    : "Analyze files and mark them as active for comparison"}
                </p>
              </Alert>
            )}
          </Tab>
        </Tabs>

        {message && (
          <Alert variant="info" className="mt-3">
            {message}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default ComparisonPanel;
