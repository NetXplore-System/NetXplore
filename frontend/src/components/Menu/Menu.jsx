import React, { useState } from "react";
import {
  SidebarContainer,
  LogoContainer,
  MenuList,
  MenuItem,
} from "./Menu.styled";
import {
  House,
  FileText,
  Clock,
  BoxArrowRight,
  Person,
} from "react-bootstrap-icons";
import LogoFull from "../../assets/Logo.png";
import LogoMini from "../../assets/LogoMini.png";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { logoutUser } from "../../redux/user/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const Menu = ({ isOpen, setIsOpen }) => {
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <SidebarContainer
      isOpen={isOpen}
      className="d-flex flex-column justify-content-between"
    >
      <div>
        <LogoContainer
          onClick={toggleSidebar}
          isOpen={isOpen}
          className="text-center py-4 mb-4"
        >
          <img
            src={isOpen ? LogoFull : LogoMini}
            alt="Logo"
            className="img-fluid"
          />
        </LogoContainer>
        <MenuList className={isOpen ? "m-3" : "pt-5"}>
          <Link to="/home">
            <MenuItem
              isOpen={isOpen}
              active
              className="d-flex align-items-center py-3 px-4"
            >
              <House size={22} />
              <span className={isOpen ? "ms-4 d-inline" : "d-none"}>
                Dashboard
              </span>
            </MenuItem>
          </Link>
          <Link to="/reports">
            <MenuItem
              isOpen={isOpen}
              className="d-flex align-items-center py-3 px-4"
            >
              <FileText size={22} />
              <span className={isOpen ? "ms-4 d-inline" : "d-none"}>
                Reports
              </span>
            </MenuItem>
          </Link>
          <Link to="/history">
            <MenuItem
              isOpen={isOpen}
              className="d-flex align-items-center py-3 px-4"
            >
              <Clock size={22} />
              <span className={isOpen ? "ms-4 d-inline" : "d-none"}>
                History
              </span>
            </MenuItem>
          </Link>
          <Link to="/profile">
            <MenuItem
              isOpen={isOpen}
              className="d-flex align-items-center py-3 px-4"
            >
              <Person size={22} />
              <span className={isOpen ? "ms-4 d-inline" : "d-none"}>
                Profile
              </span>
            </MenuItem>
          </Link>
        </MenuList>
      </div>
      <div className="border-top py-3">
        {/* <MenuItem isOpen={isOpen} className="d-flex align-items-center py-3 px-4">
          <BoxArrowRight size={22} /><span className={isOpen ? "ms-4 d-inline" : "d-none"}>Logout</span>
        </MenuItem> */}
        <MenuItem
          isOpen={isOpen}
          className="d-flex align-items-center py-3 px-4"
          onClick={handleLogout}
          style={{ cursor: "pointer" }}
        >
          <BoxArrowRight size={22} />
          <span className={isOpen ? "ms-4 d-inline" : "d-none"}>Logout</span>
        </MenuItem>
      </div>
    </SidebarContainer>
  );
};

export default Menu;
