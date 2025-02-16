import "./Header.css"; // ✅ Import styles
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
      {/* ✅ Logo Above Title */}
      <img src="/wcg_logo.png" alt="Wolf Back Office Logo" className="header-logo" />
      <h1 className="header-title">Wolf Back Office Applications</h1>

      <div className="header-info">
        <p className="header-text">Logged in as <strong>{username ? username : "Guest"}</strong></p>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
