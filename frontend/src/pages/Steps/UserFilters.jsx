import React from "react";
import { Card, Form, Row, Col } from "react-bootstrap";

const UserFilters = ({ formData, handleInputChange }) => {
  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">User Filters</h3>
        <Row className="mb-4">
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Minimum Messages Per User
              </Form.Label>
              <Form.Control
                type="number"
                name="userFilters.minMessages"
                value={formData.userFilters.minMessages}
                onChange={handleInputChange}
                min="1"
                className="research-input"
              />
              <Form.Text className="text-muted">
                Only include users who sent at least this many messages
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Maximum Messages Per User (Optional)
              </Form.Label>
              <Form.Control
                type="number"
                name="userFilters.maxMessages"
                value={formData.userFilters.maxMessages}
                onChange={handleInputChange}
                min={formData.userFilters.minMessages || 1}
                className="research-input"
              />
              <Form.Text className="text-muted">
                Only include users who sent at most this many messages
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Active Users Threshold
              </Form.Label>
              <Form.Control
                type="number"
                name="userFilters.activeUsers"
                value={formData.userFilters.activeUsers}
                onChange={handleInputChange}
                min="0"
                className="research-input"
              />
              <Form.Text className="text-muted">
                Filter to only show users with at least this many connections (0
                to show all)
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Username Filter (Optional)
              </Form.Label>
              <Form.Control
                type="text"
                name="userFilters.usernameFilter"
                value={formData.userFilters.usernameFilter}
                onChange={handleInputChange}
                placeholder="Enter username to filter"
                className="research-input"
              />
              <Form.Text className="text-muted">
                Only include users whose names contain this text
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default UserFilters;
