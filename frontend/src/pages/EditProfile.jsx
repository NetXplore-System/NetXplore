import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Container, Card } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../redux/user/userSlice";
import { PersonCircle } from "react-bootstrap-icons";

const EditProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const fileRef = useRef(null);
  const baseURL = import.meta.env.VITE_API_URL;

  const isFullUrl = (url) =>
    url?.startsWith("http://") || url?.startsWith("https://");

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    avatar: currentUser?.avatar || "",
  });

  const [file, setFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate("/signin");
  }, [token, navigate]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.size > 2 * 1024 * 1024) {
      setFileUploadError("Image must be smaller than 2MB.");
    } else {
      setFile(selected);
      setFileUploadError(null);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadAvatarAndSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = formData.avatar;

      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/upload-avatar`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadData,
          }
        );

        if (!res.ok) throw new Error("Failed to upload image");

        const data = await res.json();
        avatarUrl = data.avatarUrl;
      }

      const updatedData = { ...formData, avatar: avatarUrl };

      const saveRes = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${currentUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!saveRes.ok) throw new Error("Failed to update profile");

      const updatedUser = await saveRes.json();
      dispatch(updateUser(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      navigate("/profile");
    } catch (error) {
      setFileUploadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await uploadAvatarAndSave();
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "85vh" }}
    >
      <Card
        className="p-4 shadow-sm w-100"
        style={{ maxWidth: "600px", borderRadius: "20px" }}
      >
        <h3 className="text-center mb-4">Edit Profile</h3>

        <Form onSubmit={handleSave}>
          <Form.Group className="text-center mb-4">
            <div
              className="mb-2"
              onClick={() => fileRef.current.click()}
              style={{ cursor: "pointer" }}
            >
              {formData.avatar ? (
                <img
                  src={
                    file
                      ? URL.createObjectURL(file)
                      : isFullUrl(formData.avatar)
                      ? formData.avatar
                      : `${baseURL}${formData.avatar}`
                  }
                  alt="Avatar"
                  className="rounded-circle border"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <PersonCircle size={120} color="#6c757d" />
              )}
            </div>
            <Form.Control
              type="file"
              ref={fileRef}
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
            {fileUploadError && (
              <div className="text-danger small mt-2">{fileUploadError}</div>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your email"
              required
            />
          </Form.Group>

          <div className="text-center">
            <Button
              variant="dark"
              type="submit"
              className="rounded-pill px-4"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default EditProfile;
