import React from "react";
import { Card, Form } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";

const InfoTooltip = ({ text }) => (
  <span className="info-tooltip" title={text}>
    <InfoCircle size={16} className="ms-2" />
  </span>
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
                <InfoTooltip text="Enable analysis of message text content, not just communication structure" />
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
                <InfoTooltip text="Replace real usernames with anonymous identifiers to protect privacy" />
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
                <InfoTooltip text="A directed graph shows which user sent messages to whom. An undirected graph only shows that users communicated, without direction." />
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
                    <InfoTooltip text="This algorithm applies historical context to message exchanges, considering timing and sequence for deeper analysis." />
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
                    <InfoTooltip text="Select how many messages back the algorithm should consider in the analysis." />
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
                        <InfoTooltip text="Normalize values to account for different activity levels between users, creating a more balanced representation." />
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

            <Form.Group className="mb-4 ms-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Form.Label className="form-label mb-0">
                    Use Triad Census
                    <InfoTooltip text="Triad census analyzes communication patterns between groups of three users, identifying structures like chains, cycles, and transitive relationships." />
                  </Form.Label>
                </div>
                <Form.Check
                  type="switch"
                  id="triads-switch"
                  name="useTriads"
                  checked={formData.useTriads}
                  onChange={handleInputChange}
                  className="config-switch"
                />
              </div>
              <Form.Text className="text-muted">
                Analyze patterns between groups of three users
              </Form.Text>
            </Form.Group>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DataConfiguration;
