import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Form,
  Button,
  Alert,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import ComparisonGraph from "./ComparisonGraph";
import { useDispatch } from "react-redux";
import { clearTableData, setTableData } from "../../redux/table/tableSlice";
import { addToComparison } from "../../redux/images/imagesSlice";
import {
  FileBarGraph,
  InfoCircle,
  FileEarmarkCheck,
  Eye,
  EyeSlash,
} from "react-bootstrap-icons";

const ComparisonMetrics = ({
  originalNetworkData,
  comparisonNetworkData,
  comparisonData,
  activeComparisonIndices,
  onToggleComparison,
  filteredOriginalData,
  filteredComparisonData,
  onResetComparisonFilters,
  onApplyComparisonFilters,
}) => {
  const dispatch = useDispatch();
  const [comparisonMetric, setComparisonMetric] = useState(null);

  const graphMetrics = [
    "Degree Centrality",
    "Betweenness Centrality",
    "Closeness Centrality",
    "Eigenvector Centrality",
    "PageRank Centrality",
  ];

  const calculateComparisonStats = (originalData, comparisonData) => {
    if (!originalData || !comparisonData) {
      return null;
    }

    const originalNodeCount = originalData.nodes.length;
    const comparisonNodeCount = comparisonData.nodes.length;
    const originalLinkCount = originalData.links.length;
    const comparisonLinkCount = comparisonData.links.length;

    const nodeDifference = comparisonNodeCount - originalNodeCount;
    const linkDifference = comparisonLinkCount - originalLinkCount;

    const nodeChangePercent = originalNodeCount
      ? (
          ((comparisonNodeCount - originalNodeCount) / originalNodeCount) *
          100
        ).toFixed(2)
      : 0;
    const linkChangePercent = originalLinkCount
      ? (
          ((comparisonLinkCount - originalLinkCount) / originalLinkCount) *
          100
        ).toFixed(2)
      : 0;

    const originalNodeIds = new Set(originalData.nodes.map((node) => node.id));
    const comparisonNodeIds = new Set(
      comparisonData.nodes.map((node) => node.id)
    );

    const commonNodes = [...originalNodeIds].filter((id) =>
      comparisonNodeIds.has(id)
    );
    const commonNodesCount = commonNodes.length;

    return {
      originalNodeCount,
      comparisonNodeCount,
      originalLinkCount,
      comparisonLinkCount,
      nodeDifference,
      linkDifference,
      nodeChangePercent,
      linkChangePercent,
      commonNodesCount,
    };
  };

  const toggleComparisonMetric = (metric) => {
    const newMetric = comparisonMetric === metric ? null : metric;
    setComparisonMetric(newMetric);

    setTimeout(() => {
      if (onApplyComparisonFilters) {
        onApplyComparisonFilters({
          comparisonMetrics: newMetric ? [newMetric] : [],
        });
      }
    }, 0);
  };

  const handleResetFilters = () => {
    setComparisonMetric(null);

    if (onResetComparisonFilters) {
      onResetComparisonFilters();
    }
  };

  const activeComparisons = comparisonNetworkData.filter((data, idx) =>
    activeComparisonIndices.includes(idx)
  );

  dispatch(clearTableData());

  const handleScreenshot = (e, source, index, i) => {
    e.stopPropagation();
    const canvas = document.querySelectorAll("canvas");
    source
      ? dispatch(
          addToComparison({
            data: canvas[1].toDataURL("image/png"),
            type: "source",
            width: index > 1 ? "big" : "small",
          })
        )
      : dispatch(
          addToComparison({
            data: canvas[i + 2].toDataURL("image/png"),
            type: "comparison",
            index,
          })
        );
  };

  return (
    <>
      {comparisonNetworkData.map((data, index) => {
        if (data && data.nodes && data.links) {
          return (
            <Col md={12} key={index}>
              <Card className="graph-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>
                    Comparison #{index + 1}: {comparisonData[index]?.name || ""}
                  </span>
                  <Form.Check
                    type="switch"
                    id={`comparison-toggle-${index}`}
                    label="Add to comparison view"
                    checked={activeComparisonIndices.includes(index)}
                    onChange={() => onToggleComparison(index)}
                    className="mt-1"
                  />
                </Card.Header>
              </Card>
            </Col>
          );
        }
        return null;
      })}

      {activeComparisonIndices.length > 0 && originalNetworkData && (
        <>
          <Row className="mt-4">
            <Card className="graph-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold">Network Comparison View</h5>
              </Card.Header>
              <Card.Body>
                <div className="comparison-toolbar mb-3">
                  <div className="toolbar-section metrics-toggles d-flex justify-content-between">
                    <div className="metrics-toggle-buttons">
                      <span className="toolbar-label me-2">Metrics:</span>
                      {graphMetrics.map((metric, idx) => (
                        <OverlayTrigger
                          key={idx}
                          placement="top"
                          overlay={<Tooltip>{metric}</Tooltip>}
                        >
                          <Button
                            size="sm"
                            variant={
                              comparisonMetric === metric
                                ? "primary"
                                : "outline-secondary"
                            }
                            className="me-1"
                            onClick={() => toggleComparisonMetric(metric)}
                          >
                            {metric.split(" ")[0]}
                          </Button>
                        </OverlayTrigger>
                      ))}
                    </div>

                    <div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <Row>
                  <Col
                    md={activeComparisonIndices.length > 1 ? 12 : 6}
                    className="mb-4"
                  >
                    <Card className="graph-card">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Original Network</h5>
                        <OverlayTrigger
                          placement="top"
                          delay={{ show: 250, hide: 400 }}
                          overlay={
                            <Tooltip id={`capture-tooltip`}>
                              Capture and save the current comparison
                              visualization as an image
                            </Tooltip>
                          }
                        >
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(e) =>
                              handleScreenshot(
                                e,
                                true,
                                activeComparisonIndices.length
                              )
                            }
                          >
                            <FileEarmarkCheck className="me-1" /> Capture
                          </Button>
                        </OverlayTrigger>
                      </Card.Header>
                      <Card.Body className="p-0 position-relative">
                        <ComparisonGraph
                          graphData={
                            filteredOriginalData || originalNetworkData
                          }
                          width={
                            activeComparisonIndices.length > 1 ? 1000 : 600
                          }
                          height={500}
                          comparisonMetrics={
                            comparisonMetric ? [comparisonMetric] : []
                          }
                          directed={false}
                        />
                      </Card.Body>
                    </Card>
                  </Col>

                  {activeComparisonIndices.map((index, i) => (
                    <Col
                      md={activeComparisonIndices.length > 1 ? 6 : 6}
                      key={`comparison-${index}`}
                      className="mb-4"
                    >
                      <Card className="graph-card">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">
                            Comparison #{index + 1}:{" "}
                            {comparisonData[index]?.name || ""}
                          </h5>
                          <div>
                            <OverlayTrigger
                              placement="top"
                              delay={{ show: 250, hide: 400 }}
                              overlay={
                                <Tooltip id={`capture-tooltip`}>
                                  Capture and save the current comparison
                                  visualization as an image
                                </Tooltip>
                              }
                            >
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={(e) =>
                                  handleScreenshot(
                                    e,
                                    true,
                                    activeComparisonIndices.length
                                  )
                                }
                              >
                                <FileEarmarkCheck className="me-1" /> Capture
                              </Button>
                            </OverlayTrigger>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => onToggleComparison(index)}
                              title={
                                activeComparisonIndices.includes(index)
                                  ? "Remove from view"
                                  : "Add to view"
                              }
                            >
                              {activeComparisonIndices.includes(index) ? (
                                <EyeSlash />
                              ) : (
                                <Eye />
                              )}
                            </Button>
                          </div>
                        </Card.Header>
                        <Card.Body className="p-0 position-relative">
                          <ComparisonGraph
                            graphData={
                              filteredComparisonData &&
                              filteredComparisonData[index]
                                ? filteredComparisonData[index]
                                : comparisonNetworkData[index]
                            }
                            width={
                              activeComparisonIndices.length > 2 ? 600 : 600
                            }
                            height={500}
                            isComparisonGraph={true}
                            comparisonMetrics={
                              comparisonMetric ? [comparisonMetric] : []
                            }
                            graphIndex={index}
                            directed={comparisonData[index]?.filterSettings?.config?.directed || false}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Row>

          <Row className="mt-4 mb-4">
            <Card className="graph-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold">
                  <FileBarGraph className="me-2" /> Comparison Statistics
                </h5>
              </Card.Header>
              <Card.Body>
                {activeComparisonIndices.map((index) => {
                  const compData = comparisonNetworkData[index];
                  const stats = calculateComparisonStats(
                    originalNetworkData,
                    compData
                  );

                  if (!stats) {
                    return (
                      <Alert key={`stats-${index}`} variant="warning">
                        Could not calculate comparison statistics for Comparison
                        #{index + 1}.
                      </Alert>
                    );
                  }

                  dispatch(
                    setTableData({
                      ...stats,
                      index,
                      fileName: comparisonData[index]?.name || "unknown name",
                    })
                  );

                  return (
                    <div key={`stats-${index}`} className="mb-4">
                      <h6 className="mb-3">
                        Statistics for Comparison #{index + 1}:{" "}
                        {comparisonData[index]?.name || ""}
                      </h6>
                      <Table responsive striped bordered hover>
                        <thead className="table-light">
                          <tr>
                            <th>Metric</th>
                            <th>Original Network</th>
                            <th>Comparison Network</th>
                            <th>Difference</th>
                            <th>Change %</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <strong>Node Count</strong>
                              <OverlayTrigger
                                placement="right"
                                overlay={
                                  <Tooltip>
                                    Total number of users in the network
                                  </Tooltip>
                                }
                              >
                                <InfoCircle
                                  size={14}
                                  className="ms-2 text-muted"
                                />
                              </OverlayTrigger>
                            </td>
                            <td>{stats.originalNodeCount}</td>
                            <td>{stats.comparisonNodeCount}</td>
                            <td
                              className={
                                stats.nodeDifference > 0
                                  ? "text-success"
                                  : stats.nodeDifference < 0
                                  ? "text-danger"
                                  : ""
                              }
                            >
                              {stats.nodeDifference > 0
                                ? `+${stats.nodeDifference}`
                                : stats.nodeDifference}
                            </td>
                            <td
                              className={
                                parseFloat(stats.nodeChangePercent) > 0
                                  ? "text-success"
                                  : parseFloat(stats.nodeChangePercent) < 0
                                  ? "text-danger"
                                  : ""
                              }
                            >
                              {stats.nodeChangePercent}%
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Edge Count</strong>
                              <OverlayTrigger
                                placement="right"
                                overlay={
                                  <Tooltip>
                                    Total number of connections between users
                                  </Tooltip>
                                }
                              >
                                <InfoCircle
                                  size={14}
                                  className="ms-2 text-muted"
                                />
                              </OverlayTrigger>
                            </td>
                            <td>{stats.originalLinkCount}</td>
                            <td>{stats.comparisonLinkCount}</td>
                            <td
                              className={
                                stats.linkDifference > 0
                                  ? "text-success"
                                  : stats.linkDifference < 0
                                  ? "text-danger"
                                  : ""
                              }
                            >
                              {stats.linkDifference > 0
                                ? `+${stats.linkDifference}`
                                : stats.linkDifference}
                            </td>
                            <td
                              className={
                                parseFloat(stats.linkChangePercent) > 0
                                  ? "text-success"
                                  : parseFloat(stats.linkChangePercent) < 0
                                  ? "text-danger"
                                  : ""
                              }
                            >
                              {stats.linkChangePercent}%
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Common Nodes</strong>
                              <OverlayTrigger
                                placement="right"
                                overlay={
                                  <Tooltip>
                                    Users present in both networks
                                  </Tooltip>
                                }
                              >
                                <InfoCircle
                                  size={14}
                                  className="ms-2 text-muted"
                                />
                              </OverlayTrigger>
                            </td>
                            <td colSpan="2">{stats.commonNodesCount}</td>
                            <td colSpan="2">
                              {(
                                (stats.commonNodesCount /
                                  stats.originalNodeCount) *
                                100
                              ).toFixed(2)}
                              % of original network
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Network Density</strong>
                              <OverlayTrigger
                                placement="right"
                                overlay={
                                  <Tooltip>
                                    Ratio of actual connections to possible
                                    connections
                                  </Tooltip>
                                }
                              >
                                <InfoCircle
                                  size={14}
                                  className="ms-2 text-muted"
                                />
                              </OverlayTrigger>
                            </td>
                            <td>
                              {(
                                stats.originalLinkCount /
                                ((stats.originalNodeCount *
                                  (stats.originalNodeCount - 1)) /
                                  2)
                              ).toFixed(4)}
                            </td>
                            <td>
                              {(
                                stats.comparisonLinkCount /
                                ((stats.comparisonNodeCount *
                                  (stats.comparisonNodeCount - 1)) /
                                  2)
                              ).toFixed(4)}
                            </td>
                            <td colSpan="2">
                              {stats.comparisonNodeCount > 1 &&
                              stats.originalNodeCount > 1 ? (
                                <span
                                  className={
                                    stats.comparisonLinkCount /
                                      ((stats.comparisonNodeCount *
                                        (stats.comparisonNodeCount - 1)) /
                                        2) >
                                    stats.originalLinkCount /
                                      ((stats.originalNodeCount *
                                        (stats.originalNodeCount - 1)) /
                                        2)
                                      ? "text-success"
                                      : "text-danger"
                                  }
                                >
                                  {(
                                    (stats.comparisonLinkCount /
                                      ((stats.comparisonNodeCount *
                                        (stats.comparisonNodeCount - 1)) /
                                        2) -
                                      stats.originalLinkCount /
                                        ((stats.originalNodeCount *
                                          (stats.originalNodeCount - 1)) /
                                          2)) *
                                    100
                                  ).toFixed(2)}
                                  % change
                                </span>
                              ) : (
                                "N/A"
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </Table>

                      <Alert variant="info" className="mt-3">
                        <InfoCircle className="me-2" />
                        <strong>Analysis:</strong> This comparison shows{" "}
                        {stats.nodeDifference > 0
                          ? "an increase"
                          : "a decrease"}{" "}
                        in network size by {Math.abs(stats.nodeDifference)}{" "}
                        nodes ({Math.abs(parseFloat(stats.nodeChangePercent))}%)
                        and
                        {stats.linkDifference > 0
                          ? " an increase"
                          : " a decrease"}{" "}
                        in connections by {Math.abs(stats.linkDifference)} edges
                        ({Math.abs(parseFloat(stats.linkChangePercent))}%).
                        {stats.commonNodesCount > 0
                          ? ` There are ${stats.commonNodesCount} users (${(
                              (stats.commonNodesCount /
                                stats.originalNodeCount) *
                              100
                            ).toFixed(2)}%) present in both networks.`
                          : " There are no common users between the networks."}
                      </Alert>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Row>
        </>
      )}
    </>
  );
};

export default ComparisonMetrics;
