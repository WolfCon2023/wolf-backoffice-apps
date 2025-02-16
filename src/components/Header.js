import { useNavigate } from "react-router-dom";
import "./Header.css"; // ✅ Ensure styles are applied

const Header = ({ username, setAuthToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken("");
    navigate("/login");
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <header className="header">
      <h1>Back Office Applications ZoneOS</h1>
      <div className="header-buttons">
        <button className="logout-button" onClick={handleLogout}>Log Out</button>
        <button className="d  ashboard-header-button" onClick={handleGoToDashboard}>🏠 Dashboard</button> {/* ✅ New Button */}
      </div>
    </header>
  );
};

export default Header;
