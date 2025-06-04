import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, deleteUser } from "../redux/user/userSlice";
import { PersonCircle } from "react-bootstrap-icons";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const baseURL = import.meta.env.VITE_API_URL;
  const isFullUrl = (url) =>
    url?.startsWith("http://") || url?.startsWith("https://");
  console.log("currentUser.avatar:", currentUser.avatar);
  console.log("baseURL (VITE_API_URL):", baseURL);
  console.log("Avatar URL:", imageUrl);

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
        `${import.meta.env.VITE_API_URL}/users/${currentUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const { detail } = await response.json();
        throw new Error(detail || "Failed to delete account");
      }

      dispatch(deleteUser());
      localStorage.removeItem("token");
      navigate("/signin");
    } catch (error) {
      toast.error(error);
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
          {currentUser.avatar && currentUser.avatar.trim() !== "" ? (
            <img
              src={
                isFullUrl(currentUser.avatar)
                  ? currentUser.avatar
                  : `${baseURL}${currentUser.avatar}`
              }
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
