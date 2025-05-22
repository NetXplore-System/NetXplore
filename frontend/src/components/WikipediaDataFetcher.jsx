import React, { useState } from "react";
import { Alert, Form, Button, Row, Col } from "react-bootstrap";

const WikipediaDataFetcher = ({ setNetworkData, setWikiUrl }) => {
  const [localWikiUrl, setLocalWikiUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchData = async () => {
    if (!localWikiUrl.trim()) {
      setMessage("Please enter a Wikipedia discussion page URL.");
      return;
    }

    setWikiUrl(localWikiUrl);
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8001/fetch-wikipedia-data",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: localWikiUrl }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched Wikipedia Data:", data);

      if (data.nodes && data.links && data.nodes.length > 0) {
        const processedData = {
          nodes: data.nodes.map((node) => ({
            ...node,
            id: String(node.id),
          })),
          links: data.links.map((link) => ({
            ...link,
            source: String(link.source),
            target: String(link.target),
          })),
        };

        setNetworkData(processedData);
        setMessage(" Data successfully loaded!");
      } else {
        setMessage(" No valid discussion data found on this Wikipedia page.");
      }
    } catch (error) {
      console.error("Error loading Wikipedia data:", error);
      setMessage(` Server connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wiki-fetcher-container">
      {message && (
        <Alert
          variant={message.includes("successfully") ? "success" : "danger"}
        >
          {message}
        </Alert>
      )}
      <Form.Group className="mb-4">
        <Form.Label className="form-label">Wikipedia URL*</Form.Label>
        <Row>
          <Col xs={9}>
            <Form.Control
              type="text"
              value={localWikiUrl}
              className="research-input"
              onChange={(e) => setLocalWikiUrl(e.target.value)}
              placeholder="Enter a Wikipedia discussion or article URL"
            />
          </Col>
          <Col xs={3}>
            <Button
              onClick={handleFetchData}
              variant="primary"
              className="upload-btn"
              disabled={loading}
            >
              {loading ? "Loading..." : "Upload Wikipedia Link"}
            </Button>
          </Col>
        </Row>
        <Form.Text className="text-muted">
          Enter a valid Wikipedia URL for analysis
        </Form.Text>
      </Form.Group>{" "}
    </div>
  );
};

export default WikipediaDataFetcher;
