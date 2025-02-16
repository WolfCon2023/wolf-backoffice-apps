import "./Header.css"; 
import { useNavigate } from "react-router-dom";

const Header = ({ username, setAuthToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken("");
    navigate("/login");
  };

  return (
    <header className="header">
      {/* ✅ Keep only the Logo in the Header */}
      <img src="/wcg_logo.png" alt="Wolf Back Office Logo" className="header-logo" />

      <div className="header-info">
        <p className="header-text">Logged in as <strong>{username ? username : "Guest"}</strong></p>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
