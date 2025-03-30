import React from "react";
import { Card, Form } from "react-bootstrap";

const ActivitySlider = ({
  activityThreshold,
  setActivityThreshold,
  applyActivityFilter,
}) => {
  return (
    <Card className="research-card mt-3">
      <h4 className="fw-bold">Activity Threshold</h4>
      <p>Show users with at least this many connections:</p>
      <Form.Group>
        <div className="d-flex align-items-center">
          <Form.Range
            min={1}
            max={10}
            value={activityThreshold}
            onChange={(e) => {
              const newThreshold = parseInt(e.target.value, 10);
              setActivityThreshold(newThreshold);
              applyActivityFilter(newThreshold);
            }}
            className="flex-grow-1 me-2"
          />
          <div className="activity-value-display">{activityThreshold}</div>
        </div>
      </Form.Group>
    </Card>
  );
};

export default ActivitySlider;
