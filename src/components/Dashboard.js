import { Link } from "react-router-dom";
import { FaCalendarAlt, FaClipboardList, FaUserFriends, FaUsers, FaPlusCircle } from "react-icons/fa";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* ❌ Title removed */}

      <nav className="dashboard-menu" aria-label="Main Navigation">
        <ul>
          <li><Link to="/appointments"><FaClipboardList className="icon" /> Appointments Dashboard</Link></li>
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
