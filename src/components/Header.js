import "./Header.css";
import { useNavigate } from "react-router-dom";

const Header = ({ username, setAuthToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // ✅ Remove token
    setAuthToken(""); // ✅ Clear authentication state
    navigate("/login"); // ✅ Redirect to login page
  };

  return (
    <header className="header">
      <p className="header-text">
        Logged in as <strong>{username ? username : "Guest"}</strong>
      </p>
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
};

export default Header;
