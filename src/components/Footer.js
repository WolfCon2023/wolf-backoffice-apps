import "./Footer.css"; // ✅ Ensure styles are applied

const Footer = ({ username }) => {
  return (
    <footer className="footer">
      <p>Developed by Wolf Consulting Group, LLC</p>
      {username && <p className="footer-username">Logged in as: {username}</p>} {/* ✅ New Element */}
    </footer>
  );
};

export default Footer;