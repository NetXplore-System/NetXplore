import { useState } from "react";
import Button from "react-bootstrap/Button";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { app } from "../firebase";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading } from "react-icons/ai";
import { toast } from "sonner";


const OAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleGoogleClick = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);

      const result = await signInWithPopup(auth, provider);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
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
      toast.error("Failed to sign in with Google.");
    }
  };

  return (
    <Button
      variant="outline-danger"
      className="w-100 mb-3"
      onClick={handleGoogleClick}
    >
      {loading && <AiOutlineLoading className="spinner-icon"/>}
      Sign In with Google
    </Button>
  );
};

export default OAuth;
