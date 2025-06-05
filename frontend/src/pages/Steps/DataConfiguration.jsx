import React, { useState } from "react";
import { Card, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";

const InfoTooltip = ({ text, id }) => (
  <OverlayTrigger
    placement="top"
    delay={{ show: 250, hide: 400 }}
    overlay={<Tooltip id={`tooltip-${id}`}>{text}</Tooltip>}
  >
    <span className="info-tooltip">
      <InfoCircle size={16} className="ms-2" />
    </span>
  </OverlayTrigger>
);

const DataConfiguration = ({ formData, handleInputChange, setFormData }) => {


  const [userHasChangedWeight, setUserHasChangedWeight] = useState(false);


  const handleRangeChange = (index, value) => {
    const newValue = parseFloat(parseFloat(value).toFixed(1));
    const newMessageWeight = [...formData.messageWeight];

    newMessageWeight[index] = newValue;

    if (index > 0) {
      const firstWeight = newMessageWeight[0];
      const remainingSum = 1.0 - firstWeight;

      let otherWeightsSum = 0;
      const otherIndices = [];

      for (let i = 1; i < newMessageWeight.length; i++) {
        if (i !== index) {
          otherWeightsSum += newMessageWeight[i];
          otherIndices.push(i);
        }
      }

      const leftForOthers = remainingSum - newValue;

      if (leftForOthers > 0 && otherWeightsSum > 0 && otherIndices.length > 0) {
        const ratio = leftForOthers / otherWeightsSum;
        otherIndices.forEach(i => {
          newMessageWeight[i] = parseFloat((newMessageWeight[i] * ratio).toFixed(1));
        });
      } else if (otherIndices.length > 0) {
        const minWeight = 0.1;
        const remainingForOthers = Math.max(0, leftForOthers);
        const weightPerOther = Math.max(minWeight, remainingForOthers / otherIndices.length);

        otherIndices.forEach(i => {
          newMessageWeight[i] = parseFloat(weightPerOther.toFixed(1));
        });
      }
    } else {
      const sum = newMessageWeight.reduce((acc, val) => acc + val, 0);
      if (sum > 0) {
        const normalizedWeights = newMessageWeight.map(weight =>
          parseFloat((weight / sum).toFixed(1))
        );
        newMessageWeight.splice(0, newMessageWeight.length, ...normalizedWeights);
      }
    }

    setFormData({
      ...formData,
      messageWeight: newMessageWeight
    });
  };

  const messageWeights = formData.messageWeight || [];
  const historyLength = parseInt(formData.historyLength) || 3;

  const displayWeights = [...messageWeights];
  while (displayWeights.length < historyLength) {
    displayWeights.push(parseFloat((1.0 / historyLength).toFixed(1)));
  }
  while (displayWeights.length > historyLength) {
    displayWeights.pop();
  }

  const roundedDisplayWeights = displayWeights.map(weight =>
    parseFloat(weight.toFixed(1))
  );

  const totalSum = roundedDisplayWeights.reduce((sum, weight) => sum + weight, 0);

  return (
    <Card className="research-card">
      <Card.Body>
        <h3 className="step-title">Data Configuration</h3>

        <Form.Group className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Form.Label className="form-label mb-0">
                Include Message Content
                <InfoTooltip
                  text="Enable analysis of message text content, not just communication structure"
                  id="message-content"
                />
              </Form.Label>
            </div>
            <Form.Check
              type="switch"
              id="content-switch"
              name="includeMessageContent"
              checked={formData.includeMessageContent}
              onChange={handleInputChange}
              className="config-switch"
            />
          </div>
          <Form.Text className="text-muted">
            {formData.includeMessageContent
              ? "Message content will be analyzed (enables content-based filters)"
              : "Only communication patterns will be analyzed (no content analysis)"}
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Form.Label className="form-label mb-0">
                Anonymize User Data
                <InfoTooltip
                  text="Replace real usernames with anonymous identifiers to protect privacy"
                  id="anonymize-data"
                />
              </Form.Label>
            </div>
            <Form.Check
              type="switch"
              id="anonymize-switch"
              name="isAnonymized"
              checked={formData.isAnonymized}
              onChange={handleInputChange}
              className="config-switch"
            />
          </div>
          <Form.Text className="text-muted">
            User identities will be{" "}
            {formData.isAnonymized ? "anonymized" : "preserved"} in the network
            visualization
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Form.Label className="form-label mb-0">
                Directed Graph
                <InfoTooltip
                  text="A directed graph shows which user sent messages to whom. An undirected graph only shows that users communicated, without direction."
                  id="directed-graph"
                />
              </Form.Label>
            </div>
            <Form.Check
              type="switch"
              id="directed-switch"
              name="isDirectedGraph"
              checked={formData.isDirectedGraph}
              onChange={handleInputChange}
              className="config-switch"
            />
          </div>
          <Form.Text className="text-muted">
            {formData.isDirectedGraph
              ? "Shows direction of communication (who messaged whom)"
              : "Shows only connections between users (without direction)"}
          </Form.Text>
        </Form.Group>

        {formData.isDirectedGraph && (
          <div className="additional-options">
            <Form.Group className="mb-4 ms-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Form.Label className="form-label mb-0">
                    Use Distance Weighted Ranking Algorithm
                    <InfoTooltip
                      text="This algorithm applies historical context to message exchanges, considering timing and sequence for deeper analysis."
                      id="history-algorithm"
                    />
                  </Form.Label>
                </div>
                <Form.Check
                  type="switch"
                  id="history-switch"
                  name="useHistoryAlgorithm"
                  checked={formData.useHistoryAlgorithm}
                  onChange={handleInputChange}
                  className="config-switch"
                />
              </div>
              <Form.Text className="text-muted">
                Include temporal patterns in the analysis
              </Form.Text>
            </Form.Group>

            {formData.useHistoryAlgorithm && (
              <>
                <Form.Group className="mb-4 ms-5">
                  <Form.Label className="form-label mb-0">
                    Message History Length
                    <InfoTooltip
                      text="Select how many messages back the algorithm should consider in the analysis."
                      id="history-length"
                    />
                  </Form.Label>
                  <Form.Select
                    name="historyLength"
                    value={formData.historyLength || 3}
                    onChange={handleInputChange}
                    className="research-input mt-2"
                  >
                    <option value={2}>2 messages</option>
                    <option value={3}>3 messages</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Number of previous messages to include in the analysis
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4 ms-5">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="form-label mb-0">
                      Previous Messages Weights
                      <InfoTooltip
                        text="Set individual weights for each previous message. The first weight stays fixed when you change others."
                        id="message-weights"
                      />
                    </Form.Label>
                    <div className="d-flex align-items-center">
                      <small className="text-muted me-2">
                        Sum: <strong>{totalSum.toFixed(1)}</strong>
                        {Math.abs(totalSum - 1.0) > 0.01 && (
                          <span className="text-warning ms-1">⚠ Will be normalized</span>
                        )}
                      </small>
                      {userHasChangedWeight && (
                        <small className="text-success">✓ Custom</small>
                      )}
                      {!userHasChangedWeight && (
                        <small className="text-info">Auto</small>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    {roundedDisplayWeights.slice(0, historyLength).map((weight, index) => {
                      const messageNumber = index + 1;
                      const isFirst = index === 0;

                      return (
                        <div key={messageNumber} className="mb-3 p-3 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted fw-bold">
                              Message {messageNumber} {messageNumber === 1 ? '(most recent)' : messageNumber === 2 ? '(2nd recent)' : '(3rd recent)'}
                              {isFirst && <span className="text-primary ms-1">🔒 Protected</span>}
                            </small>
                            <span className="text-primary fw-bold">{weight.toFixed(1)}</span>
                          </div>
                          <div className="d-flex align-items-center mt-2">
                            <span className="me-2 text-muted small">0.1</span>
                            <Form.Range
                              min="0.1"
                              max="1.0"
                              step="0.1"
                              value={weight}
                              onChange={(e) => {
                                handleRangeChange(index, e.target.value);
                                setUserHasChangedWeight(true);
                              }}
                              className="flex-grow-1"
                            />
                            <span className="ms-2 text-muted small">1.0</span>
                          </div>

                          <Form.Text className="text-muted small">
                            {isFirst
                              ? "First weight - changes affect all others proportionally"
                              : "Changing this weight preserves the first weight"}
                          </Form.Text>
                        </div>
                      );
                    })}
                  </div>
                  <Form.Text className="text-muted">
                    <strong>Behavior:</strong> When you change the 2nd or 3rd weight, the 1st weight stays unchanged and other weights adjust automatically.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4 ms-5">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Form.Label className="form-label mb-0">
                        Normalized Algorithm
                        <InfoTooltip
                          text="Normalize values to account for different activity levels between users, creating a more balanced representation."
                          id="normalized-algorithm"
                        />
                      </Form.Label>
                    </div>
                    <Form.Check
                      type="switch"
                      id="normalized-switch"
                      name="isNormalized"
                      checked={formData.isNormalized}
                      onChange={handleInputChange}
                      className="config-switch"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Adjust for differences in user activity levels
                  </Form.Text>
                </Form.Group>
              </>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DataConfiguration;