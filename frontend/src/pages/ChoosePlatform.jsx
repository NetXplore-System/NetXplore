import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Whatsapp, Globe } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import "../styles/ChoosePlatform.css";

const ChoosePlatform = () => {
  const navigate = useNavigate();

  return (
    <Container fluid className="choose-platform">
      <h2 className="title">Choose Platform</h2>
      <Row className="justify-content-center align-items-center m-4">
        <Col md={6} lg={3} className="text-center mb-4">
          <Card
            className="option-card"
            onClick={() =>
              navigate("/newresearch", { state: { platform: "whatsapp" } })
            }
          >
            <div className="card-inner">
              <div className="icon-cont whatsapp">
                <Whatsapp size={60} className="option-icon" />
              </div>
              <div className="platform-info">
                <h3 className="platform-name">WhatsApp</h3>
                <p className="platform-desc">
                  Analyze chat communication patterns
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={6} lg={3} className="text-center mb-4">
          <Card
            className="option-card"
            onClick={() =>
              navigate("/newresearch", { state: { platform: "wikipedia" } })
            }
          >
            <div className="card-inner">
              <div className="icon-cont wikipedia">
                <Globe size={60} className="option-icon" />
              </div>
              <div className="platform-info">
                <h3 className="platform-name">Wikipedia</h3>
                <p className="platform-desc">Explore article relationships</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChoosePlatform;
