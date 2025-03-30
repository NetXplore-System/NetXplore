import React from "react";
import { Row, Col, Form } from "react-bootstrap";

const DateRangeFilter = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  messageLimit,
  setMessageLimit,
  limitType,
  setLimitType,
  handleInputChange,
}) => {
  return (
    <Row className="mt-3">
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">From Date:</Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">To Date:</Form.Label>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Start Time:</Form.Label>
          <Form.Control
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">End Time:</Form.Label>
          <Form.Control
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="research-input"
          />
        </Form.Group>
      </Col>

      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Message Limit:</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max="100"
            value={messageLimit}
            onChange={handleInputChange(setMessageLimit)}
            className="research-input"
          />
        </Form.Group>
      </Col>
      <Col lg={4} md={4} className="mb-3">
        <Form.Group>
          <Form.Label className="research-label">Last/First Limit:</Form.Label>
          <Form.Select
            value={limitType}
            onChange={(e) => setLimitType(e.target.value)}
            className="research-input"
          >
            <option value="first">First Messages</option>
            <option value="last">Last Messages</option>
            <option value="all">All Messages</option>
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
};

export default DateRangeFilter;