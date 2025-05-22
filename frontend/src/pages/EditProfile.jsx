import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Container, Card, Row, Col } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../redux/user/userSlice";
import { PersonCircle } from "react-bootstrap-icons";

const EditProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const [file, setFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [filePerc, setFilePerc] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate("/signin");
    }
  }, [token, navigate]);

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    avatar: currentUser?.avatar || "",
  });

  const handleSave = async (e) => {
    e.preventDefault();

    if (file) {
      try {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const response = await fetch("http://localhost:8000/upload-avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadData,
        });

        if (!response.ok) throw new Error("Failed to upload image");

        const { avatarUrl } = await response.json();
        setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
      } catch (error) {
        setFileUploadError(error.message);
        return;
      }
    }

    try {
      const response = await fetch(
        `http://localhost:8001/users/${currentUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();
      dispatch(updateUser(updatedUser));
      navigate("/profile");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 2 * 1024 * 1024) {
      setFileUploadError("Image must be less than 2MB");
    } else {
      setFile(selectedFile);
      setFileUploadError(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
                  src={formData.avatar}
                  alt="Profile"
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
            {filePerc > 0 && filePerc < 100 && (
              <div className="text-info small mt-2">Uploading {filePerc}%</div>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </Form.Group>

          <div className="text-center">
            <Button type="submit" variant="dark" className="rounded-pill px-4">
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default EditProfile;
