import React from "react";
import { Card, Form, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TimeFrame = ({ formData, handleInputChange }) => {
  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Time Frame</h3>

        <Row className="mb-4">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="form-label">Start Date (Optional)</Form.Label>
              <Form.Control
                type="date"
                lang="en"
                name="timeFrame.startDate"
                value={formData.timeFrame.startDate}
                onChange={handleInputChange}
                className="research-input"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="form-label">End Date (Optional)</Form.Label>
              <Form.Control
                type="date"
                lang="en"
                name="timeFrame.endDate"
                value={formData.timeFrame.endDate}
                onChange={handleInputChange}
                className="research-input"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="form-label">Start Time (Optional)</Form.Label>
              <Form.Control
                type="time"
                name="timeFrame.startTime"
                value={formData.timeFrame.startTime}
                onChange={handleInputChange}
                className="research-input"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="form-label">End Time (Optional)</Form.Label>
              <Form.Control
                type="time"
                name="timeFrame.endTime"
                value={formData.timeFrame.endTime}
                onChange={handleInputChange}
                className="research-input"
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-4">
          <div className="d-flex align-items-center mb-2">
            <Form.Check
              type="checkbox"
              id="limit-enabled"
              name="limit.enabled"
              checked={formData.limit.enabled}
              onChange={handleInputChange}
              className="me-2"
            />
            <Form.Label htmlFor="limit-enabled" className="form-label mb-0">
              Limit Data
            </Form.Label>
          </div>
          <Form.Text className="text-muted mb-3">
            Restrict analysis to a specific number of messages
          </Form.Text>

          {formData.limit.enabled && (
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="form-label">Limit Count</Form.Label>
                  <Form.Control
                    type="number"
                    name="limit.count"
                    value={formData.limit.count}
                    onChange={handleInputChange}
                    min="1"
                    className="research-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="form-label">Direction</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      id="from-start"
                      name="limit.fromEnd"
                      label="From Start"
                      checked={!formData.limit.fromEnd}
                      onChange={() =>
                        handleInputChange({
                          target: {
                            name: "limit.fromEnd",
                            value: false,
                            type: "radio",
                          },
                        })
                      }
                    />
                    <Form.Check
                      type="radio"
                      id="from-end"
                      name="limit.fromEnd"
                      label="From End"
                      checked={formData.limit.fromEnd}
                      onChange={() =>
                        handleInputChange({
                          target: {
                            name: "limit.fromEnd",
                            value: true,
                            type: "radio",
                          },
                        })
                      }
                      className="mb-2"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default TimeFrame;