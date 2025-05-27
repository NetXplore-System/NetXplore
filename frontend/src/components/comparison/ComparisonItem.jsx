import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  Dropdown,
  Alert,
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
  FileEarmark,
  ChatText,
} from "react-bootstrap-icons";
import DiscussionSectionPicker from "../filters/DiscussionSectionPicker";

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
  originalFileName,
  useOriginalFile,
  platform,
  formData,
  setFormData,
  wikiContent,
  setWikiContent,
  selectedSection,
  setSelectedSection,
  handleFetchWikipedia,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoadingWikipedia, setIsLoadingWikipedia] = useState(false);
  const [comparisonWikiContent, setComparisonWikiContent] = useState(null);
  const [comparisonSelectedSection, setComparisonSelectedSection] =
    useState(null);
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

  const accordionRef = useRef(null);

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
    if (
      comparisonData?.filename ||
      comparisonFile ||
      comparisonData?.isOriginalFile ||
      comparisonData?.isWikipediaData
    ) {
      const isWikipediaData =
        comparisonData?.isWikipediaData || platform === "wikipedia";
      onAnalyzeNetwork(index, localFilterSettings, isWikipediaData);
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

  const handleUseOriginalFile = () => {
    if (platform === "wikipedia") {
      const updatedData = {
        id: index,
        name: selectedSection
          ? `Original Wikipedia: ${selectedSection.title}`
          : "Original Wikipedia Discussion",
        filename: "wikipedia_data",
        isWikipediaData: true,
        isOriginalFile: true,
        isAnalyzed: false,
        wikiContent: wikiContent,
        selectedSection: selectedSection,
      };

      useOriginalFile(index);
      setComparisonWikiContent(wikiContent);
      setComparisonSelectedSection(selectedSection);
    } else {
      useOriginalFile(index);
    }

    setTimeout(() => {
      if (accordionRef.current) {
        const accordionButton =
          accordionRef.current.querySelector(".accordion-button");
        if (
          accordionButton &&
          !accordionButton.classList.contains("collapsed")
        ) {
          accordionButton.click();
        }
      }
      setShowFilters(true);
    }, 100);
  };

  const handleLoadNewWikipediaUrl = async () => {
    if (!formData.comparisonWikipediaUrl?.trim()) {
      toast.error("Please enter a valid Wikipedia URL.");
      return;
    }

    setIsLoadingWikipedia(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/fetch-wikipedia-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: formData.comparisonWikipediaUrl }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch Wikipedia data");
      }

      const data = await response.json();

      if (data?.content && data.content.length > 0) {
        setComparisonWikiContent(data.content);
        setComparisonSelectedSection(null);

        const filename = `comparison_wikipedia_data_${index}`;

        await fetch(
          `${import.meta.env.VITE_API_URL}/save-wikipedia-comparison`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: filename,
              data: data,
            }),
          }
        );

        const updatedData = {
          id: index,
          name: "Wikipedia Discussion (Please select a section)",
          filename: filename,
          isWikipediaData: true,
          isOriginalFile: false,
          isAnalyzed: false,
          wikiContent: data.content,
          selectedSection: null,
        };

        if (useOriginalFile && typeof useOriginalFile === "function") {
          const wikiData = {
            content: data.content,
            selectedSection: null,
            isWikipediaData: true,
            isOriginalFile: false,
          };
          useOriginalFile(index, wikiData);
        }

        setShowPicker(true);

        toast.success(
          "Wikipedia content loaded successfully! Please select a discussion section."
        );
      } else {
        throw new Error(
          "No valid discussion data found on this Wikipedia page."
        );
      }
    } catch (error) {
      console.error("Error loading Wikipedia:", error);
      toast.error("Failed to load Wikipedia content: " + error.message);
    } finally {
      setIsLoadingWikipedia(false);
    }
  };

  const handleSectionSelect = async (section) => {
    setComparisonSelectedSection(section);

    try {
      const filename = comparisonData?.isOriginalFile
        ? "wikipedia_data"
        : `comparison_wikipedia_data_${index}`;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/convert-wikipedia-to-txt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: filename,
            section_title: section.title,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to convert section to TXT");
      }

      if (comparisonData) {
        comparisonData.selectedSection = section;
        comparisonData.name = `Wikipedia: ${section.title}`;
        comparisonData.isAnalyzed = false;
      }

      if (onFilterChange) {
        onFilterChange(index, {
          ...localFilterSettings,
          selectedSection: section,
          filterUpdated: true,
        });
      }

      toast.success(`Section "${section.title}" selected successfully!`);
      setShowPicker(false);

      setTimeout(() => {
        if (accordionRef.current) {
          const accordionButton =
            accordionRef.current.querySelector(".accordion-button");
          if (
            accordionButton &&
            accordionButton.classList.contains("collapsed")
          ) {
            accordionButton.click();
          }
        }
      }, 100);
    } catch (error) {
      console.error("Error selecting section:", error);
      toast.error("Failed to convert section: " + error.message);
    }
  };

  const getDataDisplayName = () => {
    if (platform === "wikipedia") {
      if (comparisonData?.isOriginalFile) {
        return selectedSection
          ? `Original Wikipedia: ${selectedSection.title}`
          : "Original Wikipedia Discussion";
      } else if (comparisonSelectedSection) {
        return `Wikipedia: ${comparisonSelectedSection.title}`;
      } else if (comparisonData?.selectedSection) {
        return `Wikipedia: ${comparisonData.selectedSection.title}`;
      } else if (comparisonWikiContent || comparisonData?.wikiContent) {
        return "Wikipedia Discussion (Please select a section)";
      } else {
        return "No Wikipedia content loaded";
      }
    }
    return comparisonData?.name || "No file selected";
  };

  const hasValidData = () => {
    if (platform === "wikipedia") {
      return (
        comparisonWikiContent ||
        comparisonData?.wikiContent ||
        comparisonData?.isWikipediaData
      );
    }
    return (
      comparisonData?.filename ||
      comparisonFile ||
      comparisonData?.isOriginalFile
    );
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
              {comparisonData?.isOriginalFile && (
                <Badge bg="info" className="ms-2">
                  Original File
                </Badge>
              )}
              {comparisonData?.isWikipediaData && (
                <Badge bg="warning" className="ms-2">
                  Wikipedia
                </Badge>
              )}
            </div>
            <p className="text-muted mb-0 mt-1">{getDataDisplayName()}</p>
          </Col>
          <Col md={5} className="d-flex justify-content-end align-items-center">
            {platform === "wikipedia" ? (
              <div className="d-flex flex-column w-100">
                <Button
                  variant="outline-primary"
                  className="mb-2"
                  onClick={handleUseOriginalFile}
                  disabled={!wikiContent}
                >
                  Use Original Wikipedia Discussion
                </Button>

                <Form.Control
                  type="text"
                  placeholder="Paste new Wikipedia URL"
                  value={formData.comparisonWikipediaUrl || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comparisonWikipediaUrl: e.target.value,
                    }))
                  }
                  className="mb-2"
                />

                <Button
                  variant="secondary"
                  onClick={handleLoadNewWikipediaUrl}
                  disabled={isLoadingWikipedia}
                  className="mb-2"
                >
                  {isLoadingWikipedia ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-1"
                      />
                      Loading...
                    </>
                  ) : (
                    <>Load New Wikipedia URL</>
                  )}
                </Button>

                {(comparisonWikiContent ||
                  comparisonData?.wikiContent ||
                  comparisonData?.isWikipediaData) && (
                  <Button
                    variant="outline-info"
                    onClick={() => setShowPicker(true)}
                    className="mb-2"
                  >
                    <ChatText className="me-1" size={16} />
                    {comparisonSelectedSection ||
                    comparisonData?.selectedSection
                      ? "Change Discussion Section"
                      : "Select Discussion Section"}
                  </Button>
                )}
              </div>
            ) : (
              <Dropdown className="me-2">
                <Dropdown.Toggle variant="light" id={`file-dropdown-${index}`}>
                  <FileEarmark size={16} className="me-1" /> Select File
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() =>
                      document.getElementById(`compFile${index}`).click()
                    }
                  >
                    <Upload size={14} className="me-1" /> Upload New File
                  </Dropdown.Item>

                  {originalFileName && (
                    <Dropdown.Item onClick={handleUseOriginalFile}>
                      <FileEarmark size={14} className="me-1" /> Use Original
                      File: {originalFileName}
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}

            <input
              type="file"
              id={`compFile${index}`}
              style={{ display: "none" }}
              accept=".txt,.csv,.json"
              onChange={(e) => onFileUpload(e, index)}
            />

            {hasValidData() && (
              <>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={() => {
                    const isWikipediaData =
                      comparisonData?.isWikipediaData ||
                      platform === "wikipedia";
                    onAnalyzeNetwork(
                      index,
                      localFilterSettings,
                      isWikipediaData
                    );
                  }}
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

        {platform === "wikipedia" && showPicker && (
          <Accordion className="mt-3" defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <ChatText className="me-2" /> Select Discussion Section
              </Accordion.Header>
              <Accordion.Body>
                {comparisonWikiContent || comparisonData?.wikiContent ? (
                  <DiscussionSectionPicker
                    content={
                      comparisonWikiContent || comparisonData?.wikiContent
                    }
                    selectedSection={
                      comparisonSelectedSection ||
                      comparisonData?.selectedSection
                    }
                    onSelect={handleSectionSelect}
                    convertToTxt={async (title) => {
                      const filename = comparisonData?.isOriginalFile
                        ? "wikipedia_data"
                        : `comparison_wikipedia_data_${index}`;

                      const response = await fetch(
                        `${
                          import.meta.env.VITE_API_URL
                        }/convert-wikipedia-to-txt`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            filename: filename,
                            section_title: title,
                          }),
                        }
                      );

                      const data = await response.json();
                      if (!response.ok)
                        throw new Error(
                          data.detail || "Failed to convert section to TXT"
                        );

                      return data;
                    }}
                  />
                ) : (
                  <Alert variant="warning">
                    <InfoCircle size={16} className="me-2" />
                    No Wikipedia content loaded yet. Please load a Wikipedia URL
                    first.
                  </Alert>
                )}

                <div className="mt-3 d-flex justify-content-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPicker(false)}
                  >
                    Close
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}

        {hasValidData() && (
          <Accordion
            className="mt-3"
            defaultActiveKey={comparisonData?.isOriginalFile ? "0" : ""}
            ref={accordionRef}
          >
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <Funnel className="me-2" /> Filter Settings
                {activeFilterCount > 0 && (
                  <Badge bg="info" className="ms-2">
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

                {(comparisonData?.isOriginalFile ||
                  comparisonData?.isWikipediaData) && (
                  <div className="alert alert-info mt-3">
                    <InfoCircle size={16} className="me-2" />
                    {platform === "wikipedia"
                      ? "You're using Wikipedia data. Apply different filters and click 'Analyze' to create a comparison."
                      : "You're using the original file. Apply different filters and click 'Analyze' to create a comparison."}
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );
};

export default ComparisonItem;
