import React from "react";
import Button from "react-bootstrap/Button";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { app } from "../firebase";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";

const OAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);

      const result = await signInWithPopup(auth, provider);

      const res = await fetch("http://localhost:8000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          avatar: result.user.photoURL,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save user data");
      }

      const data = await res.json();
      dispatch(setUser(data));
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.access_token);
      navigate("/profile");
    } catch (error) {
      console.error("Google SignIn Error:", error.message);
      alert("Failed to sign in with Google.");
    }
  };

  return (
    <Button
      variant="outline-danger"
      className="w-100 mb-3"
      onClick={handleGoogleClick}
    >
      Sign In with Google
    </Button>
  );
};

export default OAuth;
