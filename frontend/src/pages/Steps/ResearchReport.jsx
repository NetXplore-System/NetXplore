import React, { useState } from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { FileBarGraph, Download } from "react-bootstrap-icons";
import { useDispatch, useSelector } from "react-redux";
import { addToMain } from "../../redux/images/imagesSlice";
import MadeReport from "../../components/utils/MadeReport";

const ResearchReport = ({
  formData,
  networkData,
  communities,
  selectedMetric,
  comparison,
  handleSaveResearch,
}) => {
  const [showDownload, setShowDownload] = useState(false);
  const { main } = useSelector((state) => state.images);
  const dispatch = useDispatch();

  const createParamsMap = () => {
    const params = new Map();

    if (formData.timeFrame.startDate) {
      params.set("start_date", formData.timeFrame.startDate);
    }
    if (formData.timeFrame.endDate) {
      params.set("end_date", formData.timeFrame.endDate);
    }

    if (formData.includeMessageContent) {
      if (formData.messageCriteria.minLength > 1) {
        params.set("min_message_length", formData.messageCriteria.minLength);
      }
      if (formData.messageCriteria.maxLength) {
        params.set("max_message_length", formData.messageCriteria.maxLength);
      }
      if (formData.messageCriteria.keywords) {
        params.set("keywords", formData.messageCriteria.keywords);
      }
    }

    if (formData.userFilters.minMessages > 1) {
      params.set("min_messages", formData.userFilters.minMessages);
    }
    if (formData.userFilters.maxMessages) {
      params.set("max_messages", formData.userFilters.maxMessages);
    }
    if (formData.userFilters.usernameFilter) {
      params.set("username_filter", formData.userFilters.usernameFilter);
    }

    return params;
  };

  const generateNetworkStats = () => {
    if (!networkData) return null;

    const { nodes, links } = networkData;
    const numNodes = nodes.length;
    const numEdges = links.length;

    const density =
      numNodes > 1 ? (2 * numEdges) / (numNodes * (numNodes - 1)) : 0;

    return {
      numNodes,
      numEdges,
      density: density.toFixed(4),
      communityCount: communities?.length || 0,
    };
  };

  const handleGenerateReport = () => {
    setShowDownload(true);
  };

  return (
    <Card className="research-card shadow-sm border-0">
      <Card.Body className="p-4">
        <h3 className="step-title fw-bold mb-3">Research Report</h3>

        <p className="text-muted mb-4">
          Review your research findings and generate a final report. Click
          "Generate Report" to customize and download your report.
        </p>

        <div className="research-summary mb-4 p-4 border rounded bg-light shadow-sm">
          <h4 className="fw-bold mb-3">Research Summary</h4>

          <Row className="mb-3 g-3">
            <Col md={6}>
              <div className="mb-2">
                <strong className="me-2">Research Name:</strong> {formData.name}
              </div>
              <div className="mb-2">
                <strong className="me-2">Data File:</strong>{" "}
                {formData.fileName || formData.uploadedFileName}
              </div>
              <div className="mb-2">
                <strong className="me-2">Anonymized:</strong>{" "}
                {formData.isAnonymized ? "Yes" : "No"}
              </div>
            </Col>

            <Col md={6}>
              <div className="mb-2">
                <strong className="me-2">Date Range:</strong>{" "}
                {formData.timeFrame.startDate
                  ? `${formData.timeFrame.startDate} to ${
                      formData.timeFrame.endDate || "Present"
                    }`
                  : "All dates"}
              </div>
              <div className="mb-2">
                <strong className="me-2">Message Content Analysis:</strong>{" "}
                {formData.includeMessageContent ? "Enabled" : "Disabled"}
              </div>
              <div className="mb-2">
                <strong className="me-2">Selected Metric:</strong>{" "}
                {selectedMetric || "None"}
              </div>
            </Col>
          </Row>

          {networkData && (
            <div className="metrics-summary p-3 border-top mt-3">
              <h5 className="fw-bold mb-3">Network Metrics</h5>
              <Row className="g-3">
                <Col md={3} sm={6}>
                  <div className="metric-card p-2 text-center rounded bg-white shadow-sm">
                    <div className="fw-bold text-primary">Nodes</div>
                    <div className="fs-4">{networkData.nodes.length}</div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="metric-card p-2 text-center rounded bg-white shadow-sm">
                    <div className="fw-bold text-primary">Links</div>
                    <div className="fs-4">{networkData.links.length}</div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="metric-card p-2 text-center rounded bg-white shadow-sm">
                    <div className="fw-bold text-primary">Communities</div>
                    <div className="fs-4">
                      {communities ? communities.length : 0}
                    </div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="metric-card p-2 text-center rounded bg-white shadow-sm">
                    <div className="fw-bold text-primary">Comparisons</div>
                    <div className="fs-4">
                      {comparison.comparisonData.length}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-center mt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerateReport}
            disabled={!networkData}
            className="px-4 py-2 shadow-sm fw-bold"
          >
            <FileBarGraph className="me-2" />
            Generate Report
          </Button>
        </div>

        {!networkData && (
          <div className="alert alert-info mt-4 shadow-sm">
            <p className="mb-0">
              Please analyze a network in the Network Visualization step before
              generating a report.
            </p>
          </div>
        )}

        {showDownload && (
          <MadeReport
            selectedMetric={selectedMetric}
            name={formData.name}
            params={createParamsMap()}
            setShowDownload={setShowDownload}
            hasComparison={comparison.comparisonNetworkData.length > 0}
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default ResearchReport;
