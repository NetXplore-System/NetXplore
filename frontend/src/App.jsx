import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
// import UploadWhatsAppFile from "./pages/Form.jsx";
import ChoosePlatform from "./pages/ChoosePlatform.jsx";
import { Toaster } from "react-hot-toast";
function App() {
  const [isOpen, setIsOpen] = useState(false);
  const user = localStorage.getItem("user");

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: '#363636',
            color: '#fff',
          },

          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'green',
              secondary: 'black',
            },  
          },
        }}
      />
      <Menu isOpen={isOpen} setIsOpen={setIsOpen} />
      <Header isOpen={isOpen} />
      {/* {user && <Header isOpen={isOpen} />} */}
      <div className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/" element={<ChoosePlatform />} />
          <Route path="/home" element={<Home />} />
          <Route path="/home_wikipedia" element={<HomeW />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
