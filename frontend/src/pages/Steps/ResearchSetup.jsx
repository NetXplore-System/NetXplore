import React from "react";
import { Card, Form, Button, Row, Col } from "react-bootstrap";
import { Upload, CheckCircle } from "react-bootstrap-icons";
import WikipediaDataFetcher from "../../components/WikipediaDataFetcher.jsx";

const ResearchSetup = ({
  formData,
  handleInputChange,
  fileInputRef,
  handleFileChange,
  platform,
  setNetworkData,
  setOriginalNetworkData,
  setWikiUrl,
  setFormData,
}) => {
  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Research Setup</h3>

        <Form.Group className="mb-4">
          <Form.Label className="form-label">Research Name*</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter a name for your research"
            className="research-input"
            required
          />
          <Form.Text className="text-muted">
            A descriptive name to identify this research
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="form-label">Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the purpose of this research"
            className="research-input"
          />
          <Form.Text className="text-muted">
            Optional description of your research goals
          </Form.Text>
        </Form.Group>

        {platform === "wikipedia" ? (
          <WikipediaDataFetcher
            setNetworkData={setNetworkData}
            setWikiUrl={setWikiUrl}
            setFormData={setFormData}
          />
        ) : (
          <Form.Group className="mb-4">
            <Form.Label className="form-label">Upload Data File*</Form.Label>
            <div className="file-upload-container">
              <Button
                variant="primary"
                className="upload-btn"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload className="me-2" />
                Choose File
              </Button>
              <Form.Control
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept=".txt"
              />
              <span className="file-name">
                {formData.fileName || "No file selected"}
              </span>
            </div>
            {formData.uploadedFileName && (
              <div className="upload-success mt-2">
                <CheckCircle className="me-2 text-success" />
                <span className="text-success">
                  File uploaded successfully!
                </span>
              </div>
            )}
            <Form.Text className="text-muted">
              Upload a WhatsApp chat export (.txt)
            </Form.Text>
          </Form.Group>
        )}
      </Card.Body>
    </Card>
  );
};

export default ResearchSetup;
