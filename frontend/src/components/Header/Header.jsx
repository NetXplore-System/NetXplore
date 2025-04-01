import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Image from "react-bootstrap/Image";
import { Bell } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ isOpen }) => {
  return (
    <Navbar isOpen={isOpen} className={`header-navbar ${isOpen ? "open" : "closed"}`}>
      <Container className="d-flex justify-content-end align-items-center">
        <div className="icon-container">
          <div className="bell-icon">
            <Bell size={22} />
          </div>
          <Link to="/profile">
            <Image
              src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
              roundedCircle
            alt="Profile"
              className="profile-image"
            />
          </Link>
        </div>
      </Container>
    </Navbar>
  );
};

export default Header;