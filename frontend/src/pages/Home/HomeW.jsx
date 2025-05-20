import React, { useState, useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Container,
  Row,
  Col,
  Form,
  Table,
  Button,
  Card,
} from "react-bootstrap";
import {
  Upload,
  Save,
  Trash,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "react-bootstrap-icons";
import { ForceGraph2D } from "react-force-graph";
import "./Home.css";
import { AlertBox, GraphContainer } from "./Form.style.js";
import AnonymizationToggle from "../../components/AnonymizationToggle.jsx";
import WikipediaDataFetcher from "../../components/WikipediaDataFetcher.jsx";

const HomeW = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState("");
  const [chartData, setChartData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [filter, setFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [messageLimit, setMessageLimit] = useState(50);
  const [keywords, setKeywords] = useState("");
  const [inputKey, setInputKey] = useState(Date.now());
  const [showFilters, setShowFilters] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showDensity, setShowDensity] = useState(false);
  const [densityValue, setDensityValue] = useState(0);
  const [showDiameter, setShowDiameter] = useState(false);
  const [diameterValue, setDiameterValue] = useState(0);
  const [showNetworkStats, setShowNetworkStats] = useState(false);
  const [networkStats, setNetworkStats] = useState({});
  const [minMessageLength, setMinMessageLength] = useState(10);
  const [maxMessageLength, setMaxMessageLength] = useState(100);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [minMessages, setMinMessages] = useState("");
  const [maxMessages, setMaxMessages] = useState("");
  const [activeUsers, setActiveUsers] = useState("");
  const [selectedUsers, setSelectedUsers] = useState("");
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [endTime, setEndTime] = useState("");
  const [startTime, setStartTime] = useState("");
  const [limitType, setLimitType] = useState("first");
  const [originalNetworkData, setOriginalNetworkData] = useState(null);
  const [strongConnectionsActive, setStrongConnectionsActive] = useState(false);
  const [wikiUrl, setWikiUrl] = useState("");

  const forceGraphRef = useRef(null);

  const graphMetrics = [
    "Degree Centrality",
    "Betweenness Centrality",
    "Closeness Centrality",
    "Eigenvector Centrality",
    "PageRank Centrality",
    "Density",
    "Diameter",
  ];
  useEffect(() => {
    if (!uploadedFile && !wikiUrl) {
      setFile(null);
      setChartData(null);
      setFilter("");
      setStartDate("");
      setNetworkData(null);
      setEndDate("");
      setMessageLimit(50);
      setKeywords("");
      setInputKey(Date.now());
      if (forceGraphRef.current && networkData) {
        forceGraphRef.current.zoomToFit(400, 100);
      }
    }
    if (networkData) {
      calculateNetworkStats();
    }
    setTimeout(() => {
      if (forceGraphRef.current) {
        forceGraphRef.current.zoomToFit(400);
      }
    }, 500);

    console.log("Updated network data in HomeW:", networkData);
    if (networkData && networkData.nodes && networkData.nodes.length > 0) {
      setShowFilters(true);
    }
  }, [uploadedFile, showMetrics, networkData, wikiUrl]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setWikiUrl("");
    setFile(selectedFile);
    setUploadedFile("");
    setChartData(null);
    setNetworkData(null);
    setOriginalNetworkData(null);
    setMessage("");
    handleSubmit(selectedFile);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const handleSubmit = (selectedFile) => {
    if (!selectedFile) {
      setMessage("Please select a file before uploading.");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    fetch("http://localhost:8001/upload", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
          setUploadedFile(data.filename);
        }
      })
      .catch(() => setMessage("An error occurred during the upload."));
  };

  const handleDelete = async () => {
    if (!uploadedFile && !wikiUrl) {
      setMessage("No file selected to delete.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8001/delete/${uploadedFile}`,
        { method: "DELETE" }
      );
      if (wikiUrl) {
        
        setWikiUrl("");
        setNetworkData(null);
        setOriginalNetworkData(null);
        setMessage("Wikipedia data cleared successfully!");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setMessage(data.message || "File deleted successfully!");
        setUploadedFile("");
        setFile(null);
        setChartData(null);
        setNetworkData(null);
        setFilter("");
        setStartDate("");
        setEndDate("");
        setMessageLimit(50);
        setKeywords("");
        setInputKey(Date.now());
      } else {
        setMessage("Error: Could not delete the file.");
      }
    } catch (error) {
      setMessage("An error occurred during the delete operation.");
    }
  };

  const formatTime = (time) => {
    return time && time.length === 5 ? `${time}:00` : time;
  };


  const handleNetworkAnalysis = () => {
    setMessage("");

    if (wikiUrl) {
      console.log("Applying filters on Wikipedia data");
      setMessage("Applying filters to Wikipedia data..."); 
      
      if (
        originalNetworkData &&
        originalNetworkData.nodes &&
        originalNetworkData.links
      ) {
        setNetworkData({ ...originalNetworkData });
        setMessage("Filters applied to Wikipedia data successfully!");
      } else {
        setMessage("No valid Wikipedia data available."); 
      }
    }
    else {
        if (!uploadedFile) {
          setMessage("No file selected for analysis.");
          console.log("No file available for network analysis.");
          return;
        }
        
      let url = `http://localhost:8001/analyze/network/${uploadedFile}`;
      const params = new URLSearchParams();

      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (messageLimit) params.append("limit", messageLimit);
      if (minMessageLength) params.append("min_length", minMessageLength);
      if (maxMessageLength) params.append("max_length", maxMessageLength);
      if (keywords) params.append("keywords", keywords);
      if (usernameFilter) params.append("username", usernameFilter);
      if (minMessages) params.append("min_messages", minMessages);
      if (maxMessages) params.append("max_messages", maxMessages);
      if (activeUsers) params.append("active_users", activeUsers);
      if (selectedUsers) params.append("selected_users", selectedUsers);
      if (startTime) params.append("start_time", formatTime(startTime));
      if (endTime) params.append("end_time", formatTime(endTime));
      if (limitType) params.append("limit_type", limitType);

      params.append("anonymize", isAnonymized ? "true" : "false");

      url += `?${params.toString()}`;
      console.log("Request URL:", url);

      setMessage("Loading network data...");

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Data returned from server:", data);
          if (data.nodes && data.links) {

            const processedData = {
              nodes: data.nodes.map((node) => ({
                ...node,
                id: String(node.id), 
              })),
              links: data.links.map((link) => ({
                ...link,
                source: String(link.source), 
                target: String(link.target), 
              })),
            };

            setNetworkData(processedData);
            setOriginalNetworkData(processedData);
            setMessage("Network analysis completed successfully!");

            setTimeout(() => {
              if (forceGraphRef.current) {
                forceGraphRef.current.zoomToFit(400);
              }
            }, 500);
          } else {
            setMessage("No valid network data returned from server.");
          }
        })
        .catch((err) => {
          setMessage(`Error during network analysis: ${err.message}`);
          console.error("Error during network analysis:", err);
        });
    }
  };

  const handleSaveToDB = () => {
    if (!name || !description) {
      setMessage("Please fill in all required fields.");
      return;
    }
    const formData = {
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      message_limit: messageLimit,
    };
    fetch("http://localhost:8001/save-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
        }
      })
      .catch(() => setMessage("An error occurred while saving the form."));
  };

  const calculateNetworkStats = () => {
    if (!networkData || !networkData.nodes || !networkData.links) return;

    const { nodes, links } = networkData;
    const numNodes = nodes.length;
    const numEdges = links.length;
    const inDegreeMap = {};
    const outDegreeMap = {};
    let reciprocalEdges = 0;

    links.forEach((link) => {
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;

      inDegreeMap[targetId] = (inDegreeMap[targetId] || 0) + 1;
      outDegreeMap[sourceId] = (outDegreeMap[sourceId] || 0) + 1;

      const hasReciprocal = links.some((l) => {
        const otherSource =
          typeof l.source === "object" ? l.source.id : l.source;
        const otherTarget =
          typeof l.target === "object" ? l.target.id : l.target;
        return otherSource === targetId && otherTarget === sourceId;
      });

      if (hasReciprocal) {
        reciprocalEdges++;
      }
    });

    const reciprocity =
      numEdges > 0 ? (reciprocalEdges / (2 * numEdges)).toFixed(2) : 0;

    setNetworkStats({
      numNodes,
      numEdges,
      reciprocity,
      inDegreeMap,
      outDegreeMap,
    });
  };

  const calculateNodeDegree = (nodes, links) => {
    const degreeMap = {};
    nodes.forEach((node) => (degreeMap[node.id] = 0));
    links.forEach((link) => {
      degreeMap[link.source] += 1;
      degreeMap[link.target] += 1;
    });
    return nodes.map((node) => ({ ...node, degree: degreeMap[node.id] || 0 }));
  };

  const handleToggleMetric = (metric) => {
    setSelectedMetric((prevMetric) => (prevMetric === metric ? null : metric));
  };

  const handleDensityMetric = () => {
    const density = calculateDensity(networkData.nodes, networkData.links);
    setDensityValue(density.toFixed(4));
    setShowDensity(!showDensity);
  };

  const calculateDiameter = (nodes, links) => {
    if (nodes.length < 2) return 0;

    const distances = {};
    nodes.forEach((node) => {
      distances[node.id] = {};
      nodes.forEach(
        (n) => (distances[node.id][n.id] = node.id === n.id ? 0 : Infinity)
      );
    });

    links.forEach((link) => {
      distances[link.source][link.target] = 1;
      distances[link.target][link.source] = 1;
    });

    nodes.forEach((k) => {
      nodes.forEach((i) => {
        nodes.forEach((j) => {
          if (
            distances[i.id][j.id] !== Infinity &&
            distances[i.id][k.id] !== Infinity &&
            distances[k.id][j.id] !== Infinity
          ) {
            distances[i.id][j.id] = Math.min(
              distances[i.id][j.id],
              distances[i.id][k.id] + distances[k.id][j.id]
            );
          }
        });
      });
    });

    let maxDistance = 0;
    nodes.forEach((i) => {
      nodes.forEach((j) => {
        if (distances[i.id][j.id] !== Infinity) {
          maxDistance = Math.max(maxDistance, distances[i.id][j.id]);
        }
      });
    });

    return maxDistance === Infinity ? 0 : maxDistance; 
  };

  const handleDiameterMetric = () => {
    setShowDiameter(!showDiameter);
    if (!showDiameter && networkData) {
      const diameter = calculateDiameter(networkData.nodes, networkData.links);
      setDiameterValue(diameter);
    }
  };

  const filteredNodes = networkData
    ? networkData.nodes.filter((node) =>
        node.id.toLowerCase().includes(filter.toLowerCase())
      )
    : [];
  const filteredLinks = networkData
    ? networkData.links.filter(
        (link) =>
          filteredNodes.some((node) => node.id === link.source) &&
          filteredNodes.some((node) => node.id === link.target)
      )
    : [];

  const handleStrongConnections = () => {
    if (!networkData || !networkData.nodes || !networkData.links) return;

    if (strongConnectionsActive) {
      setNetworkData(originalNetworkData);
      setStrongConnectionsActive(false);
    } else {
      if (!networkData.nodes.some((node) => node.betweenness !== undefined)) {
        setMessage(
          "Betweenness centrality metrics not available for this graph. Try analyzing first."
        );
        return;
      }

      const threshold = 0.2;
      const filteredNodes = networkData.nodes.filter(
        (node) => node.betweenness && node.betweenness >= threshold
      );

      if (filteredNodes.length === 0) {
        setMessage("No nodes meet the betweenness threshold criteria.");
        return;
      }

      const filteredLinks = networkData.links.filter((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;

        return (
          filteredNodes.some((node) => node.id === sourceId) &&
          filteredNodes.some((node) => node.id === targetId)
        );
      });

      setNetworkData({ nodes: filteredNodes, links: filteredLinks });
      setStrongConnectionsActive(true);
    }
  };

  return (
    <Container fluid className="upload-section">
      {/* Research Upload */}
      <Card onSubmit={handleSubmit} className="research-card">
        <Form>
          <Row className="align-items-center justify-content-between">
            <Col>
              <h4 className="fw-bold">New Research</h4>
            </Col>
            <Col className="text-end">
              <Button className="action-btn me-2">
                <Save size={16} /> Save
              </Button>
              <Button onClick={handleDelete} className="action-btn delete-btn">
                <Trash size={16} /> Delete File
              </Button>
            </Col>
          </Row>
          <Row className="mt-3 align-items-center">
            <Col lg={8} md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="research-label">
                  Research Name:
                </Form.Label>
                <Form.Control
                  type="text"
                  id="name"
                  value={name}
                  placeholder="Enter the name of your research"
                  onChange={(e) => setName(e.target.value)}
                  className="research-input"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="research-label">Description:</Form.Label>
                <Form.Control
                  type="text"
                  id="description"
                  value={description}
                  placeholder="Enter a short description"
                  onChange={(e) => setDescription(e.target.value)}
                  className="research-input"
                />
              </Form.Group>
              <div>
                <AnonymizationToggle
                  isAnonymized={isAnonymized}
                  setIsAnonymized={setIsAnonymized}
                />
              </div>
            </Col>
            <Col
              lg={4}
              md={12}
              className="d-flex flex-column align-items-center mt-3 mt-lg-0"
            >
              <WikipediaDataFetcher
                setNetworkData={(data) => {
                  console.log("Wikipedia Data received in HomeW:", data);
                  setNetworkData(data);
                  setOriginalNetworkData(data);
                  setUploadedFile(""); 
                }}
                setWikiUrl={setWikiUrl}
              />

              <Form.Control
                type="file"
                accept=".txt"
                ref={fileInputRef}
                onChange={handleFileChange}
                key={inputKey}
                style={{ display: "none" }}
              />
              {message && (
                <AlertBox success={message.includes("successfully").toString()}>
                  {message}
                </AlertBox>
              )}
            </Col>
          </Row>
        </Form>
      </Card>
      {/* Research Filters */}
      {(uploadedFile || (networkData && networkData.nodes.length > 0)) && (
        <div>
          <Card className="research-card">
            <h4 className="fw-bold d-flex justify-content-between align-items-center">
              Research Filters
              <Button
                variant="link"
                className="toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </Button>
            </h4>
            {showFilters && (
              <div>
                {wikiUrl && (
                  <div className="alert alert-info mb-3">
                    Wikipedia data loaded from: {wikiUrl}
                  </div>
                )}
                <Row className="mt-3">
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        From Date:
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        To Date:
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Start Time:
                      </Form.Label>
                      <Form.Control
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        End Time:
                      </Form.Label>
                      <Form.Control
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>

                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Message Limit:
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="100"
                        value={messageLimit}
                        onChange={handleInputChange(setMessageLimit)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Last/First Limit:
                      </Form.Label>
                      <select
                        value={limitType}
                        onChange={(e) => setLimitType(e.target.value)}
                        className="research-input"
                      >
                        <option value="first">First Messages</option>
                        <option value="last">Last Messages</option>
                        <option value="all">All Messages</option>
                      </select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Row className="mt-3">
                    <Col lg={6} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="research-label">
                          Min Message Length:
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="1000"
                          value={minMessageLength}
                          onChange={handleInputChange(setMinMessageLength)}
                          className="research-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col lg={6} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="research-label">
                          Max Message Length:
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="1000"
                          value={maxMessageLength}
                          onChange={handleInputChange(setMaxMessageLength)}
                          className="research-input"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Keywords:
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={keywords}
                        onChange={handleInputChange(setKeywords)}
                        placeholder="Enter keywords, separated by commas"
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Filter by Username:
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                        placeholder="Enter username"
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Min Messages:
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={minMessages}
                        onChange={(e) => setMinMessages(e.target.value)}
                        placeholder="Enter min messages"
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Max Messages:
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={maxMessages}
                        onChange={(e) => setMaxMessages(e.target.value)}
                        placeholder="Enter max messages"
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Top Active Users:
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={activeUsers}
                        onChange={(e) => setActiveUsers(e.target.value)}
                        placeholder="Number of top active users"
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={12} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Specific Users:
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedUsers}
                        onChange={(e) => setSelectedUsers(e.target.value)}
                        placeholder="Enter usernames, separated by commas"
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="align-items-center justify-content-between">
                  <Col>
                    <Button
                      onClick={handleNetworkAnalysis}
                      className="filter-btn"
                    >
                      Apply Filters
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </Card>

          {(uploadedFile || wikiUrl) && (
            <Row className="mt-4">
              <Col
                lg={3}
                md={12}
                className={`mb-3 metrics-panel ${
                  showMetrics ? "open" : "closed"
                }`}
              >
                <Card className="metrics-card">
                  <h4 className="fw-bold d-flex justify-content-between align-items-center">
                    {showMetrics && "Graph Metrics"}
                    <Button
                      variant="link"
                      className="metrics-toggle"
                      onClick={() => setShowMetrics(!showMetrics)}
                    >
                      {showMetrics ? (
                        <ChevronLeft size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </Button>
                  </h4>
                  {showMetrics && (
                    <div className="mt-2">
                      {graphMetrics.map((metric) => (
                        <Button
                          key={metric}
                          className={`metrics-item ${
                            selectedMetric === metric ? "active" : ""
                          }`}
                          onClick={() => {
                            handleToggleMetric(metric);
                            if (metric === "Density") handleDensityMetric();
                            if (metric === "Diameter") handleDiameterMetric();
                          }}
                        >
                          {metric}
                        </Button>
                      ))}

                      <Button
                        className={`metrics-item ${
                          strongConnectionsActive ? "active" : ""
                        }`}
                        onClick={handleStrongConnections}
                      >
                        {strongConnectionsActive
                          ? "Show All Connections"
                          : "Strongest Connections"}
                      </Button>
                    </div>
                  )}
                </Card>
                <Card className="metrics-card">
                  <h4 className="fw-bold d-flex justify-content-between align-items-center">
                    Network Metrics
                    <Button
                      variant="link"
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
                        <strong>Nodes:</strong> {networkStats.numNodes}
                      </p>
                      <p>
                        <strong>Edges:</strong> {networkStats.numEdges}
                      </p>
                      <p>
                        <strong>Reciprocity:</strong> {networkStats.reciprocity}
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
                          {Object.keys(networkStats.inDegreeMap || {})
                            .slice(0, 10)
                            .map((nodeId) => (
                              <tr key={nodeId}>
                                <td>{nodeId}</td>
                                <td>{networkStats.inDegreeMap[nodeId] || 0}</td>
                                <td>
                                  {networkStats.outDegreeMap[nodeId] || 0}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Graph Display */}
              <Col lg={9} md={12} className="graph-area">
                {(showDensity || showDiameter) && (
                  <Card className="density-card">
                    {showDensity && (
                      <h5 className="fw-bold">Graph Density: {densityValue}</h5>
                    )}
                    {showDiameter && (
                      <h5 className="fw-bold">
                        Graph Diameter: {diameterValue}
                      </h5>
                    )}
                  </Card>
                )}

                <Card className="graph-card">
                  {/* {networkData &&
                    networkData.nodes &&
                    networkData.links &&
                    networkData.nodes.length > 0 && (
                      <ForceGraph2D
                        ref={forceGraphRef}
                        graphData={networkData}
                        nodeLabel="id"
                        linkDirectionalArrowLength={3.5}
                        linkDirectionalArrowRelPos={1}
                        linkCurvature={0.25}
                        nodeAutoColorBy="group"
                        linkWidth={(link) => Math.sqrt(link.weight || 1)}
                        linkColor={() => "rgba(100, 100, 100, 0.6)"}
                        enableNodeDrag={true}
                      />
                    )} */}
                  {networkData &&
                  networkData.nodes &&
                  networkData.links &&
                  networkData.nodes.length > 0 ? (
                    <GraphContainer>
                      <ForceGraph2D
                        ref={forceGraphRef}
                        graphData={{
                          nodes: networkData.nodes,
                          links: networkData.links,
                        }}
                        nodeLabel="id"
                        linkDirectionalArrowLength={3.5}
                        linkDirectionalArrowRelPos={1}
                        linkCurvature={0.25}
                        nodeAutoColorBy="group"
                        linkWidth={(link) => Math.sqrt(link.weight || 1)}
                        linkColor={() => "rgba(100, 100, 100, 0.6)"}
                        enableNodeDrag={true}
                        onEngineStop={() => {
                          if (forceGraphRef.current) {
                            forceGraphRef.current.zoomToFit(400, 100);
                          }
                        }}
                        cooldownTime={3000}
                      />
                    </GraphContainer>
                  ) : (
                    <div className="no-data-message">
                      {message
                        ? message
                        : "No network data available. Apply filters to generate the graph."}
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          )}
        </div>
      )}
    </Container>
  );
};
export default HomeW;
