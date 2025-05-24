import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaNetworkWired,
  FaHistory,
  FaUser,
  FaPlus,
  FaSearch,
  FaWikipediaW,
  FaWhatsapp,
  FaRegCalendarAlt,
  FaLayerGroup,
  FaChartBar,
  FaArrowRight,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "sonner";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [researches, setResearches] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
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

        if (!data.researches) {
          toast.error("No research data returned");
          return;
        }

        setResearches(data.researches || []);
        setStats(data.stats || {});
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.token && user?.currentUser?.id) {
      fetchDashboardData();
    }
  }, [user?.token, user?.currentUser?.id]);

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  const ResearchTypeIcon = ({ type }) => {
    return type === "whatsapp" ? (
      <div className="research-icon whatsapp">
        <FaWhatsapp />
      </div>
    ) : (
      <div className="research-icon wikipedia">
        <FaWikipediaW />
      </div>
    );
  };

  return (
    <Container fluid className="dashboard-container">
      <div className="dashboard-div">
        <Row className="mb-4">
          <Col>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="dashboard-welcome">
                Hello,{" "}
                {user?.currentUser?.name ||
                  user?.currentUser?.username ||
                  "User"}
              </h1>
              <p className="dashboard-subtitle">
                Welcome to your network research dashboard
              </p>
            </motion.div>
          </Col>
        </Row>

        <Row className="mb-4">
          {[
            {
              icon: <FaNetworkWired />,
              count: stats.total_researches || 0,
              label: "Total Researches",
              delay: 0.1,
            },
            {
              icon: <FaWikipediaW />,
              count: stats.wikipedia_researches || 0,
              label: "Wikipedia Studies",
              delay: 0.2,
            },
            {
              icon: <FaWhatsapp />,
              count: stats.whatsapp_researches || 0,
              label: "WhatsApp Studies",
              delay: 0.3,
            },
            {
              icon: <FaLayerGroup />,
              count: stats.total_nodes || 0,
              label: "Total Nodes",
              delay: 0.4,
            },
          ].map(({ icon, count, label, delay }, index) => (
            <Col key={index} lg={3} md={6} sm={12} className="mb-4">
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.3, delay }}
              >
                <Card className="dashboard-stat-card">
                  <Card.Body>
                    <div className="stat-icon">{icon}</div>
                    <h3>{count}</h3>
                    <p>{label}</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        <Row>
          <Col>
            <Card className="dashboard-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">
                  <FaChartBar className="header-icon" /> My Researches
                </h2>
                <Button
                  variant="primary"
                  className="dashboard-action-button"
                  onClick={() => navigate("/choose-platform")}
                >
                  <FaPlus className="me-2" /> New Research
                </Button>
              </Card.Header>
              <Card.Body>
                {isLoading ? (
                  <div className="text-center p-4">Loading researches...</div>
                ) : researches.length > 0 ? (
                  <div className="research-list">
                    {researches.map((research) => (
                      <div key={research.id} className="research-item">
                        <div className="research-header">
                          <ResearchTypeIcon type={research.type} />
                          <h3>{research.name}</h3>
                          <Button
                            variant="light"
                            size="sm"
                            className="ms-auto btn-dashboard"
                            onClick={() =>
                              navigate(`/explore?research=${research.id}`)
                            }
                          >
                            <FaSearch className="me-1" /> View
                          </Button>
                        </div>
                        <p>{research.description}</p>
                        <div className="research-meta">
                          <span>
                            <strong>Nodes:</strong> {research.nodes}
                          </span>
                          <span>
                            <strong>Communities:</strong> {research.communities}
                          </span>
                          <span>
                            <FaRegCalendarAlt
                              style={{ marginRight: "5px", opacity: 0.7 }}
                            />
                            {research.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FaNetworkWired size={60} />
                    <h3>You don't have any researches yet</h3>
                    <p>
                      Start your first network research to discover insights in
                      your communication data
                    </p>
                    <Button
                      variant="primary"
                      className="dashboard-action-button"
                      onClick={() => navigate("/choose-platform")}
                    >
                      <FaPlus className="me-2" /> Start New Research
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Dashboard;
