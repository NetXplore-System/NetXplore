import React from "react";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { Upload, CheckCircle, ExclamationCircle  } from "react-bootstrap-icons";

const ResearchSetup = ({
  formData,
  handleInputChange,
  fileInputRef,
  handleFileChange,
  platform,
  setNetworkData,
  setOriginalNetworkData,
  setFormData,
  handleFetchWikipedia,
  uploadError,
  wikipediaUrlError,
}) => {
  const handleUploadClick = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

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
          <Form.Group className="mb-4">
            <Form.Label className="form-label">
              Wikipedia Discussion URL*
            </Form.Label>
            <Row>
              <Col xs={9}>
                <Form.Control
                  type="text"
                  name="wikipediaUrl"
                  value={formData.wikipediaUrl}
                  onChange={handleInputChange}
                  placeholder="Paste a Wikipedia discussion link"
                  className="research-input"
                />
              </Col>
              <Col xs={3}>
                <Button
                  onClick={handleFetchWikipedia}
                  variant="primary"
                  className="upload-btn"
                >
                  <Upload className="me-2" />
                  Upload URL
                </Button>
              </Col>
            </Row>
             {wikipediaUrlError ? (
  <div className="upload-error mt-2 d-flex align-items-center">
    <ExclamationCircle className="me-2 text-danger" />
    <span className="text-danger">{wikipediaUrlError}</span>
  </div>
) : (
  formData.uploadedFileName && (
    <div className="upload-success mt-2 d-flex align-items-center">
      <CheckCircle className="me-2 text-success" />
      <span className="text-success">
        Wikipedia discussion loaded successfully!
      </span>
    </div>
  )
)}

            <Form.Text className="text-muted">
              This will fetch and analyze discussion data from Wikipedia.
            </Form.Text>
          </Form.Group>
        ) : (
          <Form.Group className="mb-4">
            <Form.Label className="form-label">Upload Data File*</Form.Label>
            <div className="file-upload-container d-flex align-items-center">
              <Button
                variant="primary"
                className="upload-btn me-2"
                onClick={handleUploadClick}
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
           
            {uploadError ? (
              <div className="upload-error mt-2 d-flex align-items-center">
                <ExclamationCircle className="me-2 text-danger" />
                <span className="text-danger">{uploadError}</span>
              </div>
            ) : (
              formData.uploadedFileName && (
                <div className="upload-success mt-2 d-flex align-items-center">
                  <CheckCircle className="me-2 text-success" />
                  <span className="text-success">
                    File uploaded successfully!
                  </span>
                </div>
              )
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
