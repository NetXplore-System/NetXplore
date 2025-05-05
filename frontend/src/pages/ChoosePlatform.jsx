import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Whatsapp, Globe } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import "./ChoosePlatform.css";

const ChoosePlatform = () => {
  const navigate = useNavigate();

  return (
    <Container className="choose-platform">
      <h2 className="title">Choose Platform</h2>
      <Row className="justify-content-center align-items-center vh-100">
        <Col md={6} lg={4} className="text-center">
          <Card className="option-card" onClick={() => navigate("/explore")}>
            <Whatsapp size={50} className="option-icon whatsapp" />
            <h5>WhatsApp</h5>
          </Card>
        </Col>
        <Col md={6} lg={4} className="text-center">
          <Card className="option-card" onClick={() => navigate("/home_wikipedia")}>
            <Globe size={50} className="option-icon wikipedia" />
            <h5>Wikipedia</h5>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChoosePlatform;
