import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  House,
  FileText,
  Clock,
  BoxArrowRight,
  Person,
} from "react-bootstrap-icons";
import LogoFull from "../../assets/Logo.png";
import LogoMini from "../../assets/LogoMini.png";
import { logoutUser } from "../../redux/user/userSlice";
import "./Menu.css";

const Menu = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeRoute, setActiveRoute] = useState("/dashboard");

  useEffect(() => {
    const path = location.pathname;
    setActiveRoute(path);
  }, [location]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const isActive = (route) => {
    return activeRoute === route;
  };

  const menuItems = [
    { path: "/", icon: <House size={20} />, label: "Dashboard" },
    { path: "/choose-platform", icon: <FileText size={20} />, label: "New Research" },
    { path: "/history", icon: <Clock size={20} />, label: "History" },
    { path: "/profile", icon: <Person size={20} />, label: "Profile" },
  ];

  return (
    <div className={`sidebar-container ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-content">
        <div className="logo-container" onClick={toggleSidebar}>
          <img
            src={isOpen ? LogoFull : LogoMini}
            alt="Logo"
            className="logo-image"
          />
        </div>

        <div className="menu-section">
          <ul className="menu-list">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`menu-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <div className="menu-icon">{item.icon}</div>
                  {isOpen && <span className="menu-text">{item.label}</span>}
                  {isOpen && <div className="active-indicator"></div>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="menu-item logout-item" onClick={handleLogout}>
          <div className="menu-icon logout-icon">
            <BoxArrowRight size={20} />
          </div>
          {isOpen && <span className="menu-text">Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default Menu;
