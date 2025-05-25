import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Container, Row, Col } from "react-bootstrap";
import { FaSearch, FaRegCalendarAlt, FaArrowLeft, FaNetworkWired } from "react-icons/fa";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import "../styles/Dashboard.css"; // להשתמש באותו עיצוב של דשבורד

const FilteredResearches = () => {
  const { type } = useParams(); 
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [researches, setResearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFilteredResearches() {
      try {
        setIsLoading(true);
        const userId = user?.currentUser?.id;
        if (!userId) {
          toast.error("User ID is missing");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        const data = await response.json();
        const filtered = (data.researches || []).filter(
          (r) => r.type === type
        );
        setResearches(filtered);
      } catch (error) {
        console.error("Error fetching filtered researches:", error);
        toast.error("Failed to fetch researches");
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.token && user?.currentUser?.id) {
      fetchFilteredResearches();
    }
  }, [type, user?.token, user?.currentUser?.id]);

  return (
    <Container fluid className="dashboard-container py-4">
      <div className="dashboard-div">
        <Row className="mb-4">
          <Col>
         
            <h2 className="dashboard-welcome text-capitalize">
              {type} Researches
            </h2>
            <p className="dashboard-subtitle">
              Explore your filtered network research data
            </p>
          </Col>
        </Row>

        {isLoading ? (
          <div className="text-center p-4">Loading researches...</div>
        ) : researches.length > 0 ? (
          <Row>
            {researches.map((research) => (
              <Col md={6} lg={4} key={research.id} className="mb-4">
                <Card className="dashboard-stat-card h-100">
                  <Card.Body>
                    <div className="stat-icon">
                      <FaNetworkWired />
                    </div>
                    <Card.Title>{research.name}</Card.Title>
                    <Card.Text>{research.description}</Card.Text>
                    <div className="mb-2">
                      <strong>Nodes:</strong> {research.nodes} <br />
                      <strong>Communities:</strong> {research.communities} <br />
                      <FaRegCalendarAlt className="me-2" />
                      {research.date}
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/explore?research=${research.id}`)}
                    >
                      <FaSearch className="me-1" /> View
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : null}
      </div>
    </Container>
  );
};

export default FilteredResearches;
