import React from "react";
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

const DataConfiguration = ({ formData, handleInputChange }) => {
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
                    Use History Algorithm
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
