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
import "./Dashboard.css";

const fetchDashboardData = async (token) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data.researches;
};

const Dashboard = () => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [researches, setResearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser?.token) {
        try {
          setIsLoading(true);
          const data = await fetchDashboardData(currentUser.token);
          setResearches(data);
        } catch (error) {
          console.error("Error loading dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [currentUser]);

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  const totalResearches = researches.length;
  const whatsappResearches = researches.filter(
    (r) => r.type === "whatsapp"
  ).length;
  const wikipediaResearches = researches.filter(
    (r) => r.type === "wikipedia"
  ).length;
  const totalNodes = researches.reduce((sum, item) => sum + item.nodes, 0);
  const totalCommunities = researches.reduce(
    (sum, item) => sum + item.communities,
    0
  );

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

  const activities = researches
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((r, index) => ({
      id: r.id || index,
      action: "Research Created",
      details: r.name,
      date: r.date,
    }));

  return (
    <Container fluid className="dashboard-container">
      <Row className="mb-4">
        <Col>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="dashboard-welcome">
              Hello, {currentUser?.name || currentUser?.username || "User"}
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
            count: totalResearches,
            label: "Total Researches",
            delay: 0.1,
          },
          {
            icon: <FaWikipediaW />,
            count: wikipediaResearches,
            label: "Wikipedia Studies",
            delay: 0.2,
          },
          {
            icon: <FaWhatsapp />,
            count: whatsappResearches,
            label: "WhatsApp Studies",
            delay: 0.3,
          },
          {
            icon: <FaLayerGroup />,
            count: totalNodes,
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

      <Row className="mb-4">
        <Col lg={8} md={12} className="mb-4">
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card className="dashboard-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">
                  <FaChartBar className="header-icon" /> My Researches
                </h2>
                <Button
                  variant="primary"
                  className="dashboard-action-button"
                  onClick={() => navigate("/newresearch")}
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
                        <div className="research-actions">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() =>
                              navigate(`/explore?research=${research.id}`)
                            }
                          >
                            <FaSearch className="me-2" /> View Analysis
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() =>
                              navigate(`/newresearch?edit=${research.id}`)
                            }
                          >
                            Edit Research
                          </Button>
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
                      onClick={() => navigate("/newresearch")}
                    >
                      <FaPlus className="me-2" /> Start New Research
                    </Button>
                  </div>
                )}
              </Card.Body>
              {researches.length > 0 && (
                <Card.Footer>
                  <Button
                    variant="link"
                    className="view-all-link"
                    onClick={() => navigate("/history")}
                  >
                    View All Researches <FaArrowRight className="ms-2" />
                  </Button>
                </Card.Footer>
              )}
            </Card>
          </motion.div>
        </Col>

        <Col lg={4} md={12}>
          <Row>
            <Col className="mb-4">
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Card className="dashboard-card">
                  <Card.Header>
                    <h2 className="mb-0">
                      <FaHistory className="header-icon" /> Recent Activity
                    </h2>
                  </Card.Header>
                  <Card.Body>
                    {isLoading ? (
                      <div className="text-center p-4">Loading activity...</div>
                    ) : activities.length > 0 ? (
                      <div className="activity-list">
                        {activities.map((activity) => (
                          <div key={activity.id} className="activity-item">
                            <div className="activity-date">{activity.date}</div>
                            <div className="activity-content">
                              <Badge bg="success">{activity.action}</Badge>
                              <div className="activity-details">
                                {activity.details}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <FaHistory size={50} />
                        <h3>No recent activity</h3>
                        <p>Your activity will appear here</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>

          <Row>
            <Col>
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <Card className="dashboard-card">
                  <Card.Header>
                    <h2 className="mb-0">
                      <FaSearch className="header-icon" /> Quick Actions
                    </h2>
                  </Card.Header>
                  <Card.Body>
                    <div className="quick-actions">
                      <Button
                        variant="outline-primary"
                        className="quick-action-btn"
                        onClick={() => navigate("/newresearch")}
                      >
                        <FaPlus className="action-icon" />
                        <span>New Research</span>
                      </Button>
                      <Button
                        variant="outline-info"
                        className="quick-action-btn"
                        onClick={() => navigate("/explore")}
                      >
                        <FaSearch className="action-icon" />
                        <span>Explore Data</span>
                      </Button>
                      <Button
                        variant="outline-secondary"
                        className="quick-action-btn"
                        onClick={() => navigate("/history")}
                      >
                        <FaHistory className="action-icon" />
                        <span>History</span>
                      </Button>
                      <Button
                        variant="outline-dark"
                        className="quick-action-btn"
                        onClick={() => navigate("/profile")}
                      >
                        <FaUser className="action-icon" />
                        <span>Profile</span>
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
