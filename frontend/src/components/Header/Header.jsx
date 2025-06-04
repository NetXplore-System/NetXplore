import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Image from "react-bootstrap/Image";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Header.css";

const Header = ({ isOpen }) => {
  const { currentUser } = useSelector((state) => state.user);
  const baseURL = import.meta.env.VITE_API_URL;
  const isFullUrl = (url) =>
    url.startsWith("http://") || url.startsWith("https://");

  return (
    <div className={`header-wrapper ${isOpen ? "open" : "closed"}`}>
      <Navbar className="header-navbar">
        <Container
          fluid
          className="d-flex justify-content-end align-items-center"
        >
          <div className="icon-container">
            <div className="profile-container">
              <Link to="/profile">
                <Image
                  src={
                    currentUser?.avatar && currentUser.avatar.trim() !== ""
                      ? isFullUrl(currentUser.avatar)
                        ? currentUser.avatar
                        : `${baseURL}${currentUser.avatar}`
                      : "https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
                  }
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
