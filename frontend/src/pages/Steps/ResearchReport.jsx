import { useState } from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { FileBarGraph, CheckCircleFill } from "react-bootstrap-icons";
import MadeReport from "../../components/utils/MadeReport";

import "../../styles/ResearchReport.css";

const addFeild = (map, obj) => {
  for (const [key, value] of Object.entries(obj)) {
    if (value) {
      map.set(
        key.replace(/(?<!^)[A-Z]/g, ' $&'),
        typeof value === "boolean" ? (value ? "Yes" : "No") : value.toString()
      );
    }
  }
};

const ResearchReport = ({
  formData,
  networkData,
  communities,
  selectedMetric,
  comparison,
}) => {
  const [showDownload, setShowDownload] = useState(false);

  const createParamsMap = () => {
    const params = new Map();

    for (const [key, value] of Object.entries(formData.limit)) {
      if (key === "enabled") {
        params.set("Enabled Limit", value ? "Yes" : "No");
      } else if (key !== "type") {
        params.set(
          key.replace(/(?<!^)[A-Z]/g, ' $&'),
          typeof value === "boolean" ? (value ? "Yes" : "No") : value.toString()
        );
      }
    }

    for (const [key, value] of Object.entries(formData)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        key !== "Network" &&
        key !== "limit" &&
        key !== "file"
      ) {
        addFeild(params, value);
      }
      if (typeof value === "boolean" && key !== "comparisonEnabled") {
        params.set(
          key.replace(/(?<!^)[A-Z]/g, ' $&'),
          value ? "Yes" : "No"
        );
      }
      if (key === "messageWeights") {
        params.set("Message Weights", JSON.stringify(value));
      }

    }

    return params;
  };


  const handleGenerateReport = () => {
    setShowDownload(true);
  };

  return (
    <Card className="research-card">
      <Card.Body className="p-4">
        <h3 className="step-title fw-bold mb-3">Research Report</h3>

        <p className="text-muted mb-4">
          Review your research findings and generate a final report. Click
          "Generate Report" to customize and download your report.
        </p>

        <div className="research-summary mb-4 p-4 border rounded bg-light">
          <h4 className="fw-bold mb-3">Research Summary</h4>

          <Row className="mb-4 g-3">
            <Col md={6}>
              <div className="summary-item mb-3">
                <div className="summary-label mb-1">Research Name</div>
                <div className="summary-value">{formData.name}</div>
              </div>
              <div className="summary-item mb-3">
                <div className="summary-label mb-1">Data File</div>
                <div className="summary-value">
                  {formData.fileName || formData.uploadedFileName}
                </div>
              </div>
              <div className="summary-item mb-3">
                <div className="summary-label mb-1">Anonymized</div>
                <div className="summary-value d-flex align-items-center">
                  {formData.isAnonymized ? (
                    <>
                      <CheckCircleFill
                        className="text-success me-2"
                        size={14}
                      />
                      Yes
                    </>
                  ) : (
                    "No"
                  )}
                </div>
              </div>
            </Col>

            <Col md={6}>
              <div className="summary-item mb-3">
                <div className="summary-label mb-1">Date Range</div>
                <div className="summary-value">
                  {formData.timeFrame.startDate
                    ? `${formData.timeFrame.startDate} to ${
                        formData.timeFrame.endDate || "Present"
                    }`
                    : "All dates"}
                </div>
              </div>
              <div className="summary-item mb-3">
                <div className="summary-label mb-1">
                  Message Content
                </div>
                <div className="summary-value d-flex align-items-center">
                  {formData.includeMessageContent ? (
                    <>
                      <CheckCircleFill
                        className="text-success me-2"
                        size={14}
                      />
                      Enabled
                    </>
                  ) : (
                    "Disabled"
                  )}
                </div>
              </div>
              <div className="summary-item mb-3">
                <div className="summary-label mb-1">Selected Metric</div>
                <div className="summary-value">{selectedMetric || "None"}</div>
              </div>
            </Col>
          </Row>

          {networkData && (
            <div className="metrics-summary p-4 border-top mt-3">
              <h5 className="fw-bold mb-3">Network Metrics</h5>
              <Row className="g-4">
                <Col lg={3} md={6} sm={6}>
                  <div className="metric-card">
                    <div className="metric-title">Nodes</div>
                    <div className="metric-value">
                      {networkData.nodes.length}
                    </div>
                  </div>
                </Col>
                <Col lg={3} md={6} sm={6}>
                  <div className="metric-card">
                    <div className="metric-title">Links</div>
                    <div className="metric-value">
                      {networkData.links.length}
                    </div>
                  </div>
                </Col>
                <Col lg={3} md={6} sm={6}>
                  <div className="metric-card">
                    <div className="metric-title">Communities</div>
                    <div className="metric-value">
                      {communities ? communities.length : 0}
                    </div>
                  </div>
                </Col>
                <Col lg={3} md={6} sm={6}>
                  <div className="metric-card">
                    <div className="metric-title">Comparisons</div>
                    <div className="metric-value">
                      {comparison.comparisonData.length}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-center mt-4 mb-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerateReport}
            disabled={!networkData}
            className="generate-report-btn"
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
          <div className="report-download-container mt-4">
            <MadeReport
              selectedMetric={selectedMetric}
              name={formData.name}
              fileName={
                formData.uploadedFileName || formData.fileName
              }
              params={createParamsMap()}
              setShowDownload={setShowDownload}
              hasComparison={comparison.comparisonNetworkData.length > 0}
              networkData={networkData}
              communities={communities}
              comparisonFilters={comparison.comparisonFilterSettings}
              comparisonFiles={comparison.comparisonFiles}
            />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ResearchReport;
