import { useState } from "react";
import { Routes, Route, useLocation, HashRouter } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header/Header.jsx";
import Menu from "./components/Menu/Menu.jsx";
import HomeW from "./pages/HomeW.jsx";
import History from "./pages/History.jsx";
import ChoosePlatform from "./pages/ChoosePlatform.jsx";
import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import Welcome from "./pages/Welcome.jsx";

function AppContent() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/signin" ||
    location.pathname === "/register" ||
    location.pathname === "/";

  const isWelcome = location.pathname === "/";

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: "#050d2d",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "12px",
            marginTop: "30px",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />

      {!isAuthPage && (
        <>
          <Menu isOpen={isOpen} setIsOpen={setIsOpen} />
          <Header isOpen={isOpen} />
        </>
      )}

      {isWelcome ? (
        <Routes>
          <Route path="/" element={<Welcome />} />
        </Routes>
      ) : (
        <div className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/choose-platform" element={<ChoosePlatform />} />
            <Route path="/explore" element={<Home />} />
            <Route path="/home_wikipedia" element={<HomeW />} />
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/history" element={<History />} />
            </Route>
          </Routes>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
