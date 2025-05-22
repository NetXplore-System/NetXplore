import React from "react";
import { Card, Form } from "react-bootstrap";
import DiscussionSectionPicker from "../../components/filters/DiscussionSectionPicker";

const WikipediaStep = ({
  formData,
  handleInputChange,
  content,
  onSelect,
  selectedSection,
  convertToTxt,
}) => {
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
        <DiscussionSectionPicker
          content={content}
          onSelect={onSelect}
          selectedSection={selectedSection}
          convertToTxt={convertToTxt}
        />
      </Card.Body>
    </Card>
  );
};

export default WikipediaStep;
