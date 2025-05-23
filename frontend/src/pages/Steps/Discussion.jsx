import React from "react";
import { Card } from "react-bootstrap";
import DiscussionSectionPicker from "../../components/filters/DiscussionSectionPicker";

const Discussion = ({
  content,
  onSelect,
  selectedSection,
  convertToTxt,
}) => {
  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Discussion Sections</h3>
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

export default Discussion;
