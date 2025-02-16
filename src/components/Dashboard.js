import { Link } from "react-router-dom";
import { FaCalendarAlt, FaClipboardList, FaUserFriends, FaUsers, FaPlusCircle } from "react-icons/fa";
import "./Dashboard.css"; // ✅ Ensure styles are applied

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* ✅ Logo in Upper Left, Title Centered */}
      <header className="dashboard-header">
        <img src="/logo.png" alt="Wolf Back Office Logo" className="dashboard-logo" />
        <h1 className="dashboard-title">Wolf Back Office Applications</h1>
      </header>

      <nav className="dashboard-menu" aria-label="Main Navigation">
        <ul>
          <li><Link to="/appointments"><FaClipboardList className="icon" /> Appointments</Link></li>
          <li><Link to="/schedule-appointment"><FaPlusCircle className="icon" /> Schedule Appointment</Link></li>
          <li><Link to="/calendar"><FaCalendarAlt className="icon" /> Calendar</Link></li>
          <li><Link to="/customers"><FaUserFriends className="icon" /> Customers</Link></li>
          <li><Link to="/crm"><FaUsers className="icon" /> CRM</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Dashboard;