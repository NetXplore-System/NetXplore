import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Image from "react-bootstrap/Image";
import { Bell, Gear } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ isOpen }) => {
  return (
    <div className={`header-wrapper ${isOpen ? "open" : "closed"}`}>
      <Navbar className="header-navbar">
        <Container fluid className="d-flex justify-content-end align-items-center">
          <div className="icon-container">
            <div className="profile-container">
              <Link to="/profile">
                <Image
                  src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
                  roundedCircle
                  alt="Profile"
                  className="profile-image"
                />
              </Link>
            </div>
          </div>
        </Container>
      </Navbar>
    </div>
  );
};

export default Header;