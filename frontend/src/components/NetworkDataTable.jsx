import React, { useState, useMemo } from "react";
import { Table, Form, Button, Row, Col, Badge } from "react-bootstrap";
import { Search, Download, XCircle } from "react-bootstrap-icons";
import "../styles/NetworkDataTable.css";

const NetworkDataTable = ({ networkData, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentTab, setCurrentTab] = useState("nodes");

  const formatValue = (value) => {
    if (typeof value === "number") {
      return value.toFixed(4);
    }
    if (value === undefined || value === null) {
      return "-";
    }
    return value.toString();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const exportCSV = () => {
    const data =
      currentTab === "nodes"
        ? networkData.nodes
        : currentTab === "links"
        ? networkData.links
        : networkData.messages;

    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((item) =>
      Object.values(item)
        .map((value) => {
          if (typeof value === "object") return JSON.stringify(value);
          if (typeof value === "string")
            return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `network_${currentTab}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processedData = useMemo(() => {
    if (!networkData) return { nodes: [], links: [], messages: [] };

    let nodes = [...networkData.nodes];
    let links = [...networkData.links];
    let messages = networkData.messages ? [...networkData.messages] : [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      nodes = nodes.filter(
        (node) =>
          node.id.toString().toLowerCase().includes(term) ||
          (node.community !== undefined &&
            node.community.toString().includes(term))
      );

      links = links.filter((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;
        return (
          sourceId.toString().toLowerCase().includes(term) ||
          targetId.toString().toLowerCase().includes(term)
        );
      });

      if (messages.length > 0) {
        messages = messages.filter(
          (message) =>
            message.sender.toLowerCase().includes(term) ||
            message.text.toLowerCase().includes(term)
        );
      }
    }

    if (currentTab === "nodes" && sortField) {
      nodes.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (aValue === undefined)
          aValue = sortDirection === "asc" ? Infinity : -Infinity;
        if (bValue === undefined)
          bValue = sortDirection === "asc" ? Infinity : -Infinity;

        if (typeof aValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else if (currentTab === "links" && sortField) {
      links.sort((a, b) => {
        let aValue, bValue;

        if (sortField === "source" || sortField === "target") {
          aValue =
            typeof a[sortField] === "object" ? a[sortField].id : a[sortField];
          bValue =
            typeof b[sortField] === "object" ? b[sortField].id : b[sortField];
        } else {
          aValue = a[sortField];
          bValue = b[sortField];
        }

        if (aValue === undefined)
          aValue = sortDirection === "asc" ? Infinity : -Infinity;
        if (bValue === undefined)
          bValue = sortDirection === "asc" ? Infinity : -Infinity;

        if (typeof aValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else if (currentTab === "messages" && sortField && messages.length > 0) {
      messages.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (aValue === undefined)
          aValue = sortDirection === "asc" ? Infinity : -Infinity;
        if (bValue === undefined)
          bValue = sortDirection === "asc" ? Infinity : -Infinity;

        if (sortField === "timestamp") {
          return sortDirection === "asc"
            ? new Date(aValue) - new Date(bValue)
            : new Date(bValue) - new Date(aValue);
        }

        if (typeof aValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
    }

    return { nodes, links, messages };
  }, [networkData, searchTerm, sortField, sortDirection, currentTab]);

  const getNodeStats = () => {
    if (!networkData || !networkData.nodes) return {};

    const totalNodes = networkData.nodes.length;
    const communitiesCount = new Set(
      networkData.nodes
        .filter((node) => node.community !== undefined)
        .map((node) => node.community)
    ).size;

    const metrics = {};

    ["degree", "betweenness", "closeness", "eigenvector", "pagerank"].forEach(
      (metric) => {
        const values = networkData.nodes
          .filter((node) => node[metric] !== undefined)
          .map((node) => node[metric]);

        if (values.length > 0) {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          metrics[metric] = {
            avg: avg,
            min: Math.min(...values),
            max: Math.max(...values),
          };
        }
      }
    );

    return {
      totalNodes,
      communitiesCount,
      metrics,
    };
  };

  const getLinkStats = () => {
    if (!networkData || !networkData.links) return {};

    const totalLinks = networkData.links.length;

    const weights = networkData.links
      .filter((link) => link.weight !== undefined)
      .map((link) => link.weight);

    const weightStats =
      weights.length > 0
        ? {
            avg: weights.reduce((sum, val) => sum + val, 0) / weights.length,
            min: Math.min(...weights),
            max: Math.max(...weights),
          }
        : null;

    return {
      totalLinks,
      weightStats,
    };
  };

  const getMessageStats = () => {
    if (
      !networkData ||
      !networkData.messages ||
      networkData.messages.length === 0
    )
      return {};

    const totalMessages = networkData.messages.length;
    const uniqueSenders = new Set(networkData.messages.map((m) => m.sender))
      .size;

    let startDate = null;
    let endDate = null;

    if (totalMessages > 0) {
      const timestamps = networkData.messages.map((m) => new Date(m.timestamp));
      startDate = new Date(Math.min(...timestamps));
      endDate = new Date(Math.max(...timestamps));
    }

    return {
      totalMessages,
      uniqueSenders,
      startDate,
      endDate,
    };
  };

  const nodeStats = getNodeStats();
  const linkStats = getLinkStats();
  const messageStats = getMessageStats();

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const renderNodesTable = () => {
    if (!processedData.nodes || processedData.nodes.length === 0) {
      return <p>No node data available</p>;
    }

    const allFields = [
      ...new Set(processedData.nodes.flatMap((node) => Object.keys(node))),
    ];
    const primaryFields = [
      "id",
      "community",
      "degree",
      "betweenness",
      "closeness",
      "eigenvector",
      "pagerank",
    ];
    const fieldsToShow = primaryFields.filter((field) =>
      allFields.includes(field)
    );

    return (
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              {fieldsToShow.map((field) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  style={{ cursor: "pointer" }}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}{" "}
                  {renderSortIcon(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.nodes.map((node, index) => (
              <tr key={`${node.id}-${index}`}>
                {fieldsToShow.map((field) => (
                  <td key={field}>
                    {field === "community" ? (
                      node[field] !== undefined ? (
                        <Badge bg="info" className="community-badge">
                          Community {node[field]}
                        </Badge>
                      ) : (
                        "-"
                      )
                    ) : (
                      formatValue(node[field])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderLinksTable = () => {
    if (!processedData.links || processedData.links.length === 0) {
      return <p>No link data available</p>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th
                onClick={() => handleSort("source")}
                style={{ cursor: "pointer" }}
              >
                Source {renderSortIcon("source")}
              </th>
              <th
                onClick={() => handleSort("target")}
                style={{ cursor: "pointer" }}
              >
                Target {renderSortIcon("target")}
              </th>
              <th
                onClick={() => handleSort("weight")}
                style={{ cursor: "pointer" }}
              >
                Weight {renderSortIcon("weight")}
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.links.map((link, index) => (
              <tr key={index}>
                <td>
                  {typeof link.source === "object"
                    ? link.source.id
                    : link.source}
                </td>
                <td>
                  {typeof link.target === "object"
                    ? link.target.id
                    : link.target}
                </td>
                <td>{link.weight !== undefined ? link.weight : 1}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderMessagesTable = () => {
    if (!processedData.messages || processedData.messages.length === 0) {
      return <p>No message data available</p>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th
                onClick={() => handleSort("sender")}
                style={{ cursor: "pointer" }}
              >
                Sender {renderSortIcon("sender")}
              </th>
              <th
                onClick={() => handleSort("text")}
                style={{ cursor: "pointer" }}
              >
                Message {renderSortIcon("text")}
              </th>
              <th
                onClick={() => handleSort("timestamp")}
                style={{ cursor: "pointer" }}
              >
                Time {renderSortIcon("timestamp")}
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.messages.map((message, index) => (
              <tr key={index}>
                <td>{message.sender}</td>
                <td>{message.text}</td>
                <td>{new Date(message.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  if (!networkData) return <div>No data available</div>;

  return (
    <div className="network-data-table px-2">

      <Row className="mb-3">
        <Col md={6}>
          <div className="d-flex">
            <Button
              variant={currentTab === "nodes" ? "primary" : "outline-primary"}
              onClick={() => setCurrentTab("nodes")}
              className="me-2 rounded-pill"
            >
              Nodes ({networkData.nodes?.length || 0})
            </Button>
            <Button
              variant={currentTab === "links" ? "primary" : "outline-primary"}
              onClick={() => setCurrentTab("links")}
              className="me-2 rounded-pill"
            >
              Links ({networkData.links?.length || 0})
            </Button>
          </div>
        </Col>
        <Col md={6}>
          <div className="d-flex">
            <Form.Control
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="me-2 search-input"
            />
            <Button
              variant="outline-success"
              onClick={exportCSV}
              className="rounded-pill"
            >
              <Download size={20} />
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <div className="stats-summary p-3 bg-light rounded">
            <Row>
              {currentTab === "nodes" && (
                <>
                  <Col md={3}>
                    <div className="text-center stat-item">
                      <h5>Nodes</h5>
                      <h2>{nodeStats.totalNodes}</h2>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center stat-item">
                      <h5>Communities</h5>
                      <h2>{nodeStats.communitiesCount}</h2>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center stat-item">
                      <h5>Avg. Degree</h5>
                      <h2>
                        {nodeStats.metrics?.degree?.avg.toFixed(2) || "-"}
                      </h2>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center stat-item">
                      <h5>Avg. Betweenness</h5>
                      <h2>
                        {nodeStats.metrics?.betweenness?.avg.toFixed(4) || "-"}
                      </h2>
                    </div>
                  </Col>
                </>
              )}

              {currentTab === "links" && (
                <>
                  <Col md={4}>
                    <div className="text-center stat-item">
                      <h5>Total Links</h5>
                      <h2>{linkStats.totalLinks}</h2>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center stat-item">
                      <h5>Avg. Weight</h5>
                      <h2>{linkStats.weightStats?.avg.toFixed(2) || "-"}</h2>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center stat-item">
                      <h5>Max Weight</h5>
                      <h2>{linkStats.weightStats?.max || "-"}</h2>
                    </div>
                  </Col>
                </>
              )}

              {currentTab === "messages" && (
                <>
                  <Col md={4}>
                    <div className="text-center stat-item">
                      <h5>Total Messages</h5>
                      <h2>{messageStats.totalMessages || 0}</h2>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center stat-item">
                      <h5>Unique Senders</h5>
                      <h2>{messageStats.uniqueSenders || 0}</h2>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center stat-item">
                      <h5>Date Range</h5>
                      <h2 style={{ fontSize: "1rem" }}>
                        {messageStats.startDate && messageStats.endDate
                          ? `${messageStats.startDate.toLocaleDateString()} - 
                              ${messageStats.endDate.toLocaleDateString()}`
                          : "-"}
                      </h2>
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </div>
        </Col>
      </Row>

      {currentTab === "nodes"
        ? renderNodesTable()
        : currentTab === "links"
        ? renderLinksTable()
        : renderMessagesTable()}
    </div>
  );
};

export default NetworkDataTable;
