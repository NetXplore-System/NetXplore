import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../redux/user/userSlice";

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
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://localhost:8000/upload-avatar", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const { avatarUrl } = await response.json();
        setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
      } catch (error) {
        setFileUploadError(error.message);
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:8001/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

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
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center">Edit Profile</h2>
      <Form onSubmit={handleSave} className="mt-4" style={{ maxWidth: "500px", margin: "0 auto" }}>
        <Form.Group className="text-center mb-4">
          <div className="mb-3">
            <img
              src={formData.avatar || "https://cdn-icons-png.flaticon.com/512/64/64572.png"} 
              alt="profile"
              className="rounded-circle img-thumbnail"
              style={{ width: "150px", height: "150px", cursor: "pointer" }}
              onClick={() => fileRef.current.click()}
            />
          </div>
          <Form.Control
            type="file"
            ref={fileRef}
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
          {fileUploadError && <small className="text-danger">{fileUploadError}</small>}
          {filePerc > 0 && filePerc < 100 && <small className="text-info">Uploading {filePerc}%</small>}
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicName">
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

        <Form.Group className="mb-3" controlId="formBasicEmail">
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
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditProfile;
