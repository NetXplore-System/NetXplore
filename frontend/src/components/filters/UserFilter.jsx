import React from "react";
import { Row, Col, Form } from "react-bootstrap";

const UserFilter = ({
  usernameFilter,
  setUsernameFilter,
  minMessages,
  setMinMessages,
  maxMessages,
  setMaxMessages,
  activeUsers,
  setActiveUsers,
  selectedUsers,
  setSelectedUsers,
}) => {
  return (
    <Row className="mt-3">
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Filter by Username:</Form.Label>
          <Form.Control
            type="text"
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
            placeholder="Enter username"
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Min Messages:</Form.Label>
          <Form.Control
            type="number"
            value={minMessages}
            onChange={(e) => setMinMessages(e.target.value)}
            placeholder="Enter min messages"
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Max Messages:</Form.Label>
          <Form.Control
            type="number"
            value={maxMessages}
            onChange={(e) => setMaxMessages(e.target.value)}
            placeholder="Enter max messages"
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Top Active Users:</Form.Label>
          <Form.Control
            type="number"
            value={activeUsers}
            onChange={(e) => setActiveUsers(e.target.value)}
            placeholder="Number of top active users"
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={12} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Specific Users:</Form.Label>
          <Form.Control
            type="text"
            value={selectedUsers}
            onChange={(e) => setSelectedUsers(e.target.value)}
            placeholder="Enter usernames, separated by commas"
            className="research-input"
          />
        </Form.Group>
      </Col>
    </Row>
  );
};

export default UserFilter;