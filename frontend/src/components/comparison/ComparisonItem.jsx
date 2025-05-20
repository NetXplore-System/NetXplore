import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Form,
  Collapse,
  Badge,
  Accordion,
  Spinner,
} from "react-bootstrap";
import {
  Upload,
  Clock,
  Funnel,
  ChevronDown,
  ChevronUp,
  ArrowClockwise,
  Lightning,
  InfoCircle,
} from "react-bootstrap-icons";

const ComparisonItem = ({
  index,
  comparisonData,
  comparisonFile,
  filterSettings,
  onFileUpload,
  onAnalyzeNetwork,
  onFilterChange,
  isActive,
  onToggleActive,
  isAnalyzing,
  activeFilterCount,
  hasActiveFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilterSettings, setLocalFilterSettings] = useState({
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

  useEffect(() => {
    if (filterSettings) {
      setLocalFilterSettings(filterSettings);
    }
  }, [filterSettings]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      let newValue;
      if (type === "checkbox") {
        newValue = checked;
      } else if (type === "number") {
        newValue = value === "" ? "" : Number(value);
      } else {
        newValue = value;
      }

      const updatedSettings = {
        ...localFilterSettings,
        [parent]: {
          ...localFilterSettings[parent],
          [child]: newValue,
        },
      };

      setLocalFilterSettings(updatedSettings);

      if (onFilterChange) {
        onFilterChange(index, updatedSettings);
      }
    } else {
      const updatedSettings = {
        ...localFilterSettings,
        [name]: type === "checkbox" ? checked : value,
      };

      setLocalFilterSettings(updatedSettings);

      if (onFilterChange) {
        onFilterChange(index, updatedSettings);
      }
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const applyFilters = () => {
    if (comparisonData?.filename || comparisonFile) {
      onAnalyzeNetwork(index, localFilterSettings);
    }
  };

  const resetFilters = () => {
    const defaultSettings = {
      timeFrame: {
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
      },
      limit: {
        enabled: false,
        count: 50,
        fromEnd: false,
        type: "messages",
      },
      messageCriteria: {
        minLength: 1,
        maxLength: "",
        keywords: "",
        contentFilter: "",
      },
      userFilters: {
        minMessages: 1,
        maxMessages: "",
        usernameFilter: "",
      },
    };

    setLocalFilterSettings(defaultSettings);

    if (onFilterChange) {
      onFilterChange(index, defaultSettings);
    }
  };

  return (
    <Card
      className={`comparison-file-card mb-3 ${isActive ? "active-card" : ""}`}
    >
      <Card.Body>
        <Row className="align-items-center">
          <Col md={7}>
            <div className="d-flex align-items-center">
              <h5 className="mb-0">Comparison #{index + 1}</h5>
              {hasActiveFilters && (
                <Badge bg="info" className="ms-2">
                  {activeFilterCount}{" "}
                  {activeFilterCount === 1 ? "filter" : "filters"}
                </Badge>
              )}
              {comparisonData?.isAnalyzed && (
                <Badge bg="success" className="ms-2">
                  Analyzed
                </Badge>
              )}
            </div>
            <p className="text-muted mb-0 mt-1">
              {comparisonData?.name || "No file selected"}
            </p>
          </Col>
          <Col md={5} className="d-flex justify-content-end align-items-center">
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={() =>
                document.getElementById(`compFile${index}`).click()
              }
            >
              <Upload size={16} className="me-1" /> Upload
            </Button>
            <input
              type="file"
              id={`compFile${index}`}
              style={{ display: "none" }}
              accept=".txt,.csv,.json"
              onChange={(e) => onFileUpload(e, index)}
            />

            {(comparisonData?.filename || comparisonFile) && (
              <>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={() => onAnalyzeNetwork(index, localFilterSettings)}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-1"
                      />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Lightning className="me-1" /> Analyze
                    </>
                  )}
                </Button>

                <Form.Check
                  type="switch"
                  id={`comparison-toggle-${index}`}
                  checked={isActive}
                  onChange={onToggleActive}
                  label=""
                  className="ms-1"
                  title={
                    isActive ? "Hide from comparison" : "Show in comparison"
                  }
                />
              </>
            )}
          </Col>
        </Row>

        {(comparisonData?.filename || comparisonFile) && (
          <Accordion className="mt-3">
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <Funnel className="me-2" /> Filter Settings
                {activeFilterCount > 0 && (
                  <Badge bg="primary" className="ms-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={12} className="d-flex justify-content-between mb-3">
                    <h6 className="mb-0">
                      <InfoCircle className="me-1" /> Configure filters for this
                      comparison
                    </h6>
                    <div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={resetFilters}
                        title="Reset all filters"
                      >
                        <ArrowClockwise size={14} className="me-1" /> Reset All
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={applyFilters}
                        title="Apply filters and analyze"
                      >
                        Apply Filters & Analyze
                      </Button>
                    </div>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={12}>
                    <h6 className="filter-section-title">
                      <Clock className="me-2" /> Time Frame
                    </h6>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="timeFrame.startDate"
                        value={localFilterSettings.timeFrame?.startDate || ""}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="timeFrame.startTime"
                        value={localFilterSettings.timeFrame?.startTime || ""}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="timeFrame.endDate"
                        value={localFilterSettings.timeFrame?.endDate || ""}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="timeFrame.endTime"
                        value={localFilterSettings.timeFrame?.endTime || ""}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={12}>
                    <h6 className="filter-section-title">
                      <Funnel className="me-2" /> Message Limits
                    </h6>
                  </Col>
                  <Col md={3}>
                    <Form.Check
                      type="checkbox"
                      id={`limit-enabled-${index}`}
                      label="Limit messages"
                      name="limit.enabled"
                      checked={localFilterSettings.limit?.enabled || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>Message Count</Form.Label>
                      <Form.Control
                        type="number"
                        name="limit.count"
                        value={localFilterSettings.limit?.count || 50}
                        onChange={handleFilterChange}
                        disabled={!localFilterSettings.limit?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>From</Form.Label>
                      <Form.Select
                        name="limit.fromEnd"
                        value={(
                          localFilterSettings.limit?.fromEnd || false
                        ).toString()}
                        onChange={(e) =>
                          handleFilterChange({
                            target: {
                              name: "limit.fromEnd",
                              value: e.target.value === "true",
                              type: "select",
                            },
                          })
                        }
                        disabled={!localFilterSettings.limit?.enabled}
                      >
                        <option value="false">First</option>
                        <option value="true">End</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );
};

export default ComparisonItem;
