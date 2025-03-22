import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaClipboardList, 
  FaUsers, 
  FaPlusCircle,
  FaChartLine,
  FaCog,
  FaQuestionCircle,
  FaEnvelope,
  FaTasks,
  FaUserShield,
} from "react-icons/fa";
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <h1>Success Toolkit</h1>
        <p>Access your business applications and tools</p>
      </div>

      <div className="dashboard-content">
        <section className="main-apps">
          <h2>Core Applications</h2>
          <nav className="dashboard-menu" aria-label="Main Navigation">
            <ul>
              <li>
                <Link to="/appointments" className="app-card primary">
                  <div className="card-icon">
                    <FaClipboardList className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>Appointments Dashboard</h3>
                    <p>Manage and track appointments</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/schedule-appointment" className="app-card success">
                  <div className="card-icon">
                    <FaPlusCircle className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>Schedule Appointment</h3>
                    <p>Create new appointments</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="app-card info">
                  <div className="card-icon">
                    <FaCalendarAlt className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>Calendar</h3>
                    <p>View and manage schedule</p>
                  </div>
                </Link>
              </li>
              <li>
                <a href="https://mail.vitalinc.net/" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="app-card email">
                  <div className="card-icon">
                    <FaEnvelope className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>Email/Chat</h3>
                    <p>Access Zimbra webmail</p>
                  </div>
                </a>
              </li>
              <li>
                <Link to="/crm" className="app-card warning">
                  <div className="card-icon">
                    <FaUsers className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>CRM</h3>
                    <p>Customer relationship management</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="app-card analytics">
                  <div className="card-icon">
                    <FaChartLine className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>Analytics</h3>
                    <p>Business insights and metrics</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/projects" className="app-card stratflow">
                  <div className="card-icon">
                    <FaTasks className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>StratFlow</h3>
                    <p>Project and team management</p>
                  </div>
                </Link>
              </li>
            </ul>
          </nav>
        </section>

        <section className="admin-apps">
          <h2>System Administration Tools</h2>
          <nav className="dashboard-menu" aria-label="Administration Navigation">
            <ul>
              <li>
                <Link to="/admin/users" className="app-card admin">
                  <div className="card-icon">
                    <FaUserShield className="icon" />
                  </div>
                  <div className="card-content">
                    <h3>User Administration</h3>
                    <p>Manage users and permissions</p>
                  </div>
                </Link>
              </li>
            </ul>
          </nav>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link to="/settings" className="quick-action-card">
              <FaCog />
              <span>Settings</span>
            </Link>
            <Link to="/help" className="quick-action-card">
              <FaQuestionCircle />
              <span>Help</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard; 