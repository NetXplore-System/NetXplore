import React from "react";
import { Card, Form, Row, Col } from "react-bootstrap";

const MessageContent = ({ formData, handleInputChange }) => {
  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Message Content Filters</h3>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Minimum Message Length
              </Form.Label>
              <Form.Control
                type="number"
                name="messageCriteria.minLength"
                value={formData.messageCriteria.minLength}
                onChange={handleInputChange}
                min="1"
                className="research-input"
              />
              <Form.Text className="text-muted">
                Minimum characters in a message to include
              </Form.Text>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Maximum Message Length (Optional)
              </Form.Label>
              <Form.Control
                type="number"
                name="messageCriteria.maxLength"
                value={formData.messageCriteria.maxLength}
                onChange={handleInputChange}
                min={formData.messageCriteria.minLength || 1}
                className="research-input"
              />
              <Form.Text className="text-muted">
                Maximum characters in a message to include
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Keywords (Optional)
              </Form.Label>
              <Form.Control
                type="text"
                name="messageCriteria.keywords"
                value={formData.messageCriteria.keywords}
                onChange={handleInputChange}
                placeholder="Enter keywords separated by commas"
                className="research-input"
              />
              <Form.Text className="text-muted">
                Only include messages containing any of these keywords
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Content Filter (Optional)
              </Form.Label>
              <Form.Control
                type="text"
                name="messageCriteria.contentFilter"
                value={formData.messageCriteria.contentFilter}
                onChange={handleInputChange}
                placeholder="Filter messages containing specific text"
                className="research-input"
              />
              <Form.Text className="text-muted">
                Only include messages that match this text pattern
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default MessageContent;
