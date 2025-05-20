import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, deleteUser } from "../redux/user/userSlice";
import { PersonCircle } from "react-bootstrap-icons";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);

  useEffect(() => {
    if (!currentUser || !token) {
      navigate("/signin");
    }
  }, [currentUser, token, navigate]);

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/users/${currentUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete account");
      }

      dispatch(deleteUser());
      localStorage.removeItem("token");
      navigate("/signin");
    } catch (error) {
      alert(error.message);
    }
  };

  if (!currentUser || !token) {
    return <p>Loading your profile...</p>;
  }

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <Card
        className="p-4 shadow-sm w-100"
        style={{ maxWidth: "600px", borderRadius: "20px" }}
      >
        <div className="text-center mb-4">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt="Profile"
              className="rounded-circle border"
              style={{ width: "120px", height: "120px", objectFit: "cover" }}
            />
          ) : (
            <PersonCircle size={120} color="#6c757d" />
          )}
        </div>
        <h3 className="text-center mb-1">Welcome, {currentUser.name}!</h3>
        <p className="text-center text-muted mb-4">{currentUser.email}</p>

        <Row className="justify-content-center">
          <Col xs="auto">
            <Button
              variant="dark"
              onClick={handleEditProfile}
              className="rounded-pill px-4"
            >
              Edit Profile
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant="danger"
              onClick={handleLogout}
              className="rounded-pill px-4"
            >
              Logout
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-danger"
              onClick={handleDeleteAccount}
              className="rounded-pill px-4"
            >
              Delete Account
            </Button>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default Profile;
