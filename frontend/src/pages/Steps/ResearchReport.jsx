import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { FileBarGraph, Download } from "react-bootstrap-icons";
import { toast } from "react-hot-toast";
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
    handleSaveResearch();
    setShowDownload(true);
  };

  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Research Report</h3>

        <p className="text-muted mb-4">
          Review your research findings and generate a final report. Click
          "Generate Report" to customize and download your report.
        </p>

        <div className="research-summary mb-4 p-3 border rounded bg-light">
          <h4>Research Summary</h4>

          <Row className="mb-3">
            <Col md={6}>
              <p>
                <strong>Research Name:</strong> {formData.name}
              </p>
              <p>
                <strong>Data File:</strong>{" "}
                {formData.fileName || formData.uploadedFileName}
              </p>
              <p>
                <strong>Anonymized:</strong>{" "}
                {formData.isAnonymized ? "Yes" : "No"}
              </p>
            </Col>

            <Col md={6}>
              <p>
                <strong>Date Range:</strong>{" "}
                {formData.timeFrame.startDate
                  ? `${formData.timeFrame.startDate} to ${
                      formData.timeFrame.endDate || "Present"
                    }`
                  : "All dates"}
              </p>
              <p>
                <strong>Message Content Analysis:</strong>{" "}
                {formData.includeMessageContent ? "Enabled" : "Disabled"}
              </p>
              <p>
                <strong>Selected Metric:</strong> {selectedMetric || "None"}
              </p>
            </Col>
          </Row>

          {networkData && (
            <div className="metrics-summary p-3 border-top">
              <h5>Network Metrics</h5>
              <Row>
                <Col md={3}>
                  <p>
                    <strong>Nodes:</strong> {networkData.nodes.length}
                  </p>
                </Col>
                <Col md={3}>
                  <p>
                    <strong>Links:</strong> {networkData.links.length}
                  </p>
                </Col>
                <Col md={3}>
                  <p>
                    <strong>Communities:</strong>{" "}
                    {communities ? communities.length : 0}
                  </p>
                </Col>
                <Col md={3}>
                  <p>
                    <strong>Comparisons:</strong>{" "}
                    {comparison.comparisonData.length}
                  </p>
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
            className="px-4"
          >
            <FileBarGraph className="me-2" />
            Generate Report
          </Button>
        </div>

        {!networkData && (
          <div className="alert alert-info mt-4">
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
