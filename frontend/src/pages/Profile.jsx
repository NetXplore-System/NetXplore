import  { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, deleteUser } from "../redux/user/userSlice";
import toast from "react-hot-toast";


const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);

  useEffect(() => {
    if (!currentUser || !token) {
      console.log("User not authenticated, redirecting to sign-in...");
      navigate("/sign-in");
    }
  }, [currentUser, token, navigate]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/sign-in");
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const { detail } = await response.json();
        throw new Error(detail || "Failed to delete account");
      }

      dispatch(deleteUser());
      navigate("/sign-in");
    } catch (error) {
      toast.error(error);
    }
  };

  if (!currentUser || !token) {
    return <p>Loading your profile...</p>;
  }

  const avatarUrl = currentUser.avatar || "";

  return (
    <>
      <Container className="text-center mt-5">
        <div className="mb-4">
          <img
            src={avatarUrl}
            alt="Profile"
            className="rounded-circle img-thumbnail"
            style={{ width: "150px", height: "150px" }}
          />
        </div>
        <h2>Welcome, {currentUser.name}!</h2>
        <p>Email: {currentUser.email}</p>
        <div className="mt-4">
          <Button variant="primary" className="me-2" onClick={handleEditProfile}>
            Edit Profile
          </Button>
          <Button variant="danger" className="me-2" onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="outline-danger" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </div>
      </Container>
    </>
  );
};

export default Profile;
