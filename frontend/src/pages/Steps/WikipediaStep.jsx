import React from "react";
import { Card, Form } from "react-bootstrap";

const WikipediaStep = ({ formData, handleInputChange }) => {
  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Discussion Sections</h3>
        <Form.Group className="mb-3">
          <Form.Label>Select Discussion Section Type</Form.Label>
          
        </Form.Group>
        {formData.discussionSection === "custom" && (
          <Form.Group className="mb-3">
            <Form.Label>Custom Keywords (comma separated)</Form.Label>
            <Form.Control
              type="text"
              name="discussionKeywords"
              value={formData.discussionKeywords || ""}
              onChange={handleInputChange}
              placeholder="e.g. deletion, RfC, NPOV"
            />
          </Form.Group>
        )}
      </Card.Body>
    </Card>
  );
};

export default WikipediaStep;
