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
import { GrConfigure } from "react-icons/gr"; 
import DiscussionSectionPicker from "../filters/DiscussionSectionPicker";
import "../../styles/ComparativeAnalysis.css";

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
  setComparisonNetworkData
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
    config: {
      directed: false,
      anonymize: false,
      history: false,
      messageCount: 3,
      normalized: false,
    }
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
      let updatedSettings;
      if (name === "config.directed" && !newValue) {
        updatedSettings = {
          ...localFilterSettings,
          config: {
            ...localFilterSettings.config,
            directed: newValue,
            history: false,
            normalized: false,
          },
        };
      } else {
        updatedSettings = {
          ...localFilterSettings,
          [parent]: {
            ...localFilterSettings[parent],
            [child]: newValue,
          },
        };
      }
      
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
      config: {
        directed: false,
        anonymize: false,
        history: false,
        messageCount: 3,
        normalized: false,
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
            filename: filename,
            rawData: data,
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
      const isOriginalFile = comparisonData?.isOriginalFile;
      let filename;

      if (isOriginalFile) {
        filename = "wikipedia_data";
      } else {
        filename = `comparison_wikipedia_data_${index}`;

        const wikiContent =
          comparisonWikiContent || comparisonData?.wikiContent;
        if (wikiContent) {
          const tempResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/fetch-wikipedia-data`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: formData.comparisonWikipediaUrl,
                save_as: filename,
              }),
            }
          );

          if (!tempResponse.ok) {
            console.warn(
              "Could not save comparison data, using fallback method"
            );
          }
        }
      }

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
        if (data.detail && data.detail.includes("not found")) {
          await createComparisonFileFromLocalData(filename, section);

          const retryResponse = await fetch(
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

          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            throw new Error(
              retryData.detail || "Failed to convert section to TXT"
            );
          }
        } else {
          throw new Error(data.detail || "Failed to convert section to TXT");
        }
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

  const createComparisonFileFromLocalData = async (filename, section) => {
    try {
      const wikiContent = comparisonWikiContent || comparisonData?.wikiContent;
      if (!wikiContent) {
        throw new Error("No Wikipedia content available");
      }

      const dataStructure = {
        content: [
          {
            sections: wikiContent,
          },
        ],
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/create-temp-wikipedia-file`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: filename,
            data: dataStructure,
          }),
        }
      );

      if (!response.ok) {
        console.warn("Could not create temporary file on server");
      }
    } catch (error) {
      console.warn("Error creating comparison file:", error);
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
          <Col md={8}>
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
          <Col md={4} className="d-flex justify-content-end align-items-start">
            {platform === "wikipedia" ? (
              <div className="comparison-actions-container w-100">
                <div className="mb-2">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleUseOriginalFile}
                    disabled={!wikiContent}
                    className="w-100"
                  >
                    Use Original Wikipedia Discussion
                  </Button>
                </div>

                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="Paste new Wikipedia URL"
                    value={formData.comparisonWikipediaUrl || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        comparisonWikipediaUrl: e.target.value,
                      }))
                    }
                    className="flex-grow-1"
                  />
                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleLoadNewWikipediaUrl}
                    disabled={isLoadingWikipedia}
                    style={{ minWidth: "70px" }}
                  >
                    {isLoadingWikipedia ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      "Load"
                    )}
                  </Button>
                </div>

                {(comparisonWikiContent ||
                  comparisonData?.wikiContent ||
                  comparisonData?.isWikipediaData) && (
                    <div className="mb-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowPicker(true)}
                        className="w-100"
                      >
                        <ChatText className="me-1" size={14} />
                        {comparisonSelectedSection ||
                          comparisonData?.selectedSection
                          ? "Change Discussion Section"
                          : "Select Discussion Section"}
                      </Button>
                    </div>
                  )}

                {hasValidData() && (
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
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
                      className="flex-grow-1"
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
                          <Lightning className="me-1" size={14} />
                          Analyze
                        </>
                      )}
                    </Button>
                    <Form.Check
                      type="switch"
                      id={`comparison-toggle-${index}`}
                      checked={isActive}
                      onChange={onToggleActive}
                      label=""
                      title={
                        isActive ? "Hide from comparison" : "Show in comparison"
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="comparison-actions-container w-100">
                <div className="mb-2">
                  <Dropdown className="w-100">
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      size="sm"
                      id={`file-dropdown-${index}`}
                      className="w-100 d-flex align-items-center justify-content-between"
                    >
                      <span>
                        <FileEarmark size={14} className="me-1" />
                        Select File
                      </span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="w-100">
                      <Dropdown.Item
                        onClick={() =>
                          document.getElementById(`compFile${index}`).click()
                        }
                      >
                        <Upload size={14} className="me-1" /> Upload New File
                      </Dropdown.Item>

                      {originalFileName && (
                        <Dropdown.Item onClick={handleUseOriginalFile}>
                          <FileEarmark size={14} className="me-1" /> Use
                          Original File
                        </Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {hasValidData() && (
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
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
                      className="flex-grow-1"
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
                          <Lightning className="me-1" size={14} />
                          Analyze
                        </>
                      )}
                    </Button>
                    <Form.Check
                      type="switch"
                      id={`comparison-toggle-${index}`}
                      checked={isActive}
                      onChange={onToggleActive}
                      label=""
                      title={
                        isActive ? "Hide from comparison" : "Show in comparison"
                      }
                    />
                  </div>
                )}

                <input
                  type="file"
                  id={`compFile${index}`}
                  style={{ display: "none" }}
                  accept=".txt,.csv,.json"
                  onChange={(e) => onFileUpload(e, index)}
                />
              </div>
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
                      const isOriginalFile = comparisonData?.isOriginalFile;
                      const filename = isOriginalFile
                        ? "wikipedia_data"
                        : `comparison_wikipedia_data_${index}`;

                      try {
                        const response = await fetch(
                          `${import.meta.env.VITE_API_URL
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

                        if (!response.ok) {
                          if (
                            data.detail &&
                            data.detail.includes("not found")
                          ) {
                            await createComparisonFileFromLocalData(filename, {
                              title,
                            });

                            const retryResponse = await fetch(
                              `${import.meta.env.VITE_API_URL
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

                            const retryData = await retryResponse.json();
                            if (!retryResponse.ok) {
                              throw new Error(
                                retryData.detail ||
                                "Failed to convert section to TXT"
                              );
                            }
                            return retryData;
                          } else {
                            throw new Error(
                              data.detail || "Failed to convert section to TXT"
                            );
                          }
                        }

                        return data;
                      } catch (error) {
                        console.error("Error in convertToTxt:", error);
                        throw error;
                      }
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
                <Row className="mb-3">
                  <Col md={12}>
                    <h6 className="filter-section-title">
                      <GrConfigure className="me-2" /> Config
                    </h6>
                  </Col>
                  <Col md={3}>
                    <Form.Check
                      type="checkbox"
                      id={`config-anonymize-${index}`}
                      label="Use Anonymization"
                      name="config.anonymize"
                      checked={localFilterSettings.config?.anonymize || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Check
                      type="checkbox"
                      id={`config-directed-${index}`}
                      label="Directed Graph"
                      name="config.directed"
                      checked={localFilterSettings.config?.directed || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Check
                      type="checkbox"
                      id={`config-history-${index}`}
                      label="Use History Algorithm"
                      name="config.history"
                      checked={localFilterSettings.config?.history || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                      disabled={!localFilterSettings.config?.directed}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-2">
                      <Form.Label>Message History Length</Form.Label>
                      <Form.Select
                        name="config.messageCount"
                        value={(
                          localFilterSettings.config?.messageCount || 3
                        ).toString()}
                        onChange={(e) =>
                          handleFilterChange({
                            target: {
                              name: "config.messageCount",
                              value: e.target.value,
                              type: "select",
                            },
                          })
                        }
                        disabled={!localFilterSettings.config?.history || !localFilterSettings?.config?.directed}
                      >
                        <option value="3">3</option>
                        <option value="2">2</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Check
                      type="checkbox"
                      id={`config-normalized-${index}`}
                      label="Normalized Algorithm"
                      name="config.normalized"
                      checked={localFilterSettings.config?.normalized || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                      disabled={!localFilterSettings.config?.directed}
                    />
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={12}>
                    <h6 className="filter-section-title">
                      <GrConfigure className="me-2" /> Config
                    </h6>
                  </Col>
                  <Col md={3}>
                    <Form.Check
                      type="checkbox"
                      id={`config-anonymize-${index}`}
                      label="Use Anonymization"
                      name="config.anonymize"
                      checked={localFilterSettings.config?.anonymize || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Check
                      type="checkbox"
                      id={`config-directed-${index}`}
                      label="Directed Graph"
                      name="config.directed"
                      checked={localFilterSettings.config?.directed || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Check
                      type="checkbox"
                      id={`config-history-${index}`}
                      label="Use History Algorithm"
                      name="config.history"
                      checked={localFilterSettings.config?.history || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                      disabled={!localFilterSettings.config?.directed}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-2">
                      <Form.Label>Message History Length</Form.Label>
                      <Form.Select
                        name="config.messageCount"
                        value={(
                          localFilterSettings.config?.messageCount || 3
                        ).toString()}
                        onChange={(e) =>
                          handleFilterChange({
                            target: {
                              name: "config.messageCount",
                              value: e.target.value,
                              type: "select",
                            },
                          })
                        }
                        disabled={!localFilterSettings.config?.history || !localFilterSettings?.config?.directed}
                      >
                        <option value="3">3</option>
                        <option value="2">2</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Check
                      type="checkbox"
                      id={`config-normalized-${index}`}
                      label="Normalized Algorithm"
                      name="config.normalized"
                      checked={localFilterSettings.config?.normalized || false}
                      onChange={handleFilterChange}
                      className="mb-2"
                      disabled={!localFilterSettings.config?.directed}
                    />
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
