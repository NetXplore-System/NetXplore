import React from "react";
import { Row, Col, Form } from "react-bootstrap";

const MessageFilter = ({
  minMessageLength,
  setMinMessageLength,
  maxMessageLength,
  setMaxMessageLength,
  keywords,
  setKeywords,
  handleInputChange,
}) => {
  return (
    <Row className="mt-3">
      <Col lg={6} md={6} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">
            Min Message Length (Characters):
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
            Max Message Length (Characters):
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
      <Col lg={12} md={12} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Keywords:</Form.Label>
          <Form.Control
            type="text"
            value={keywords}
            onChange={handleInputChange(setKeywords)}
            placeholder="Enter keywords, separated by commas"
            className="research-input"
          />
        </Form.Group>
      </Col>
    </Row>
  );
};

export default MessageFilter;