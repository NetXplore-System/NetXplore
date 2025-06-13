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
import { fetchWithAuth } from "../components/utils/ApiService";

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

        const response = await fetchWithAuth(
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

  return isLoading ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="dashboard-loading-container"
    >
      <motion.div
        className="dashboard-spinner"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.h4
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="dashboard-loading-text"
      >
        Loading your dashboard...
      </motion.h4>
    </motion.div>
  ) : (
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
              onClick: () => navigate("/researches/wikipedia"),
            },
            {
              icon: <FaWhatsapp />,
              count: stats.whatsapp_researches || 0,
              label: "WhatsApp Studies",
              delay: 0.3,
              onClick: () => navigate("/researches/whatsapp"),
            },
            {
              icon: <FaLayerGroup />,
              count: stats.total_nodes || 0,
              label: "Total Nodes",
              delay: 0.4,
            },
          ].map(({ icon, count, label, delay, onClick }, index) => (
            <Col key={index} lg={3} md={6} sm={12} className="mb-4">
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.3, delay }}
              >
                <Card
                  className="dashboard-stat-card"
                  onClick={onClick}
                  style={{ cursor: onClick ? "pointer" : "default" }}
                >
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
                  <FaChartBar className="d-header-icon" /> My Researches
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
                    {researches.slice(0, 3).map((research) => (
                      <div key={research.id} className="research-item">
                        <div className="research-header">
                          <ResearchTypeIcon type={research.type} />
                          <h3>{research.name}</h3>
                          <Button
                            variant="light"
                            size="sm"
                            className="ms-auto btn-dashboard"
                            onClick={() =>
                              navigate(`/history?view=${research.id}`)
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
                    <div className="d-flex justify-content-center">
                      <Button
                        variant="primary"
                        className="dashboard-action-button"
                        onClick={() => navigate("/history")}
                      >
                        View all researches
                      </Button>
                    </div>
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
                      Start New Research
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
