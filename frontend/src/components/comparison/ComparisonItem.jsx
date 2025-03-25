import React from "react";
import { Button, Card, Row, Col } from "react-bootstrap";
import { Upload } from "react-bootstrap-icons";

const ComparisonItem = ({
  index,
  comparisonData,
  onFileUpload,
  onAnalyzeNetwork,
}) => {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={4}>
            <h5>Comparison File #{index + 1}</h5>
            {comparisonData?.filename ? (
              <p>{comparisonData.name}</p>
            ) : (
              <p>No file selected</p>
            )}
          </Col>
          <Col md={8} className="text-end">
            <Button
              className="action-btn me-2"
              onClick={() =>
                document.getElementById(`compFile${index}`).click()
              }
            >
              <Upload size={16} /> Upload File
            </Button>
            <input
              type="file"
              id={`compFile${index}`}
              style={{ display: "none" }}
              accept=".txt"
              onChange={(e) => onFileUpload(e, index)}
            />
            {comparisonData?.filename && (
              <Button
                className="action-btn"
                onClick={() => onAnalyzeNetwork(index)}
              >
                Analyze Network
              </Button>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ComparisonItem;
