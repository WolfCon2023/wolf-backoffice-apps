import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./Header.css";

const Header = ({ username, setAuthToken }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Handle menu item clicks and close dropdown
  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false); // ✅ Close dropdown when clicking an option
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken("");
    setMenuOpen(false); // ✅ Close dropdown after logout
    navigate("/login");
  };

  return (
    <>
      {/* ✅ Header now fixed and main content adjusted below */}
      <header className="header">
        <h1 className="header-title">Back Office Applications ZoneOS</h1>

        {/* ✅ Dropdown Menu on Right Side */}
        <div
          ref={dropdownRef}
          className={`header-dropdown ${menuOpen ? "active" : ""}`}
          aria-expanded={menuOpen ? "true" : "false"}
        >
          <button
            className="dropdown-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen ? "true" : "false"}
          >
            <FaUserCircle size={24} />
          </button>

          <ul className="dropdown-menu">
            <li onClick={() => handleNavigate("/dashboard")}>🏠 Home</li>
            <li onClick={handleLogout}>🚪 Logout</li>
          </ul>
        </div>
      </header>

      {/* ✅ Ensures the main container doesn't move up */}
      <div className="main-content">
        {/* This wrapper ensures spacing below the header */}
      </div>
    </>
  );
};

export default Header;
