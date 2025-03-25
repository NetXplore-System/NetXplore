import React from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { Upload, Save, Trash } from "react-bootstrap-icons";
import { AlertBox } from "../../pages/Form.style";
import AnonymizationToggle from "../AnonymizationToggle.jsx";

const ResearchCard = ({
  name,
  setName,
  description,
  setDescription,
  isAnonymized,
  setIsAnonymized,
  handleUploadClick,
  handleDelete,
  fileInputRef,
  handleFileChange,
  inputKey,
  message,
}) => {
  return (
    <Card className="research-card">
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
              <Form.Label className="research-label">Research Name:</Form.Label>
              <Form.Control
                type="text"
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
                value={description}
                placeholder="Enter a short description"
                onChange={(e) => setDescription(e.target.value)}
                className="research-input"
              />
            </Form.Group>
            <div className="mx-2 my-4 align-items-center">
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
            <Button className="upload-btn" onClick={handleUploadClick}>
              <Upload size={16} /> Upload File
            </Button>
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
  );
};

export default ResearchCard;
