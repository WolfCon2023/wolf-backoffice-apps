import "./Header.css"; // ✅ Import the styles

const Header = ({ username }) => {
  return (
    <header className="header">
      <p className="header-text">Logged in as <strong>{username ? username : "Guest"}</strong></p>
    </header>
  );
};

export default Header;