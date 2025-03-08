import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaClipboardList, 
  FaUsers, 
  FaPlusCircle,
  FaChartLine,
  FaCog,
  FaQuestionCircle
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
            </ul>
          </nav>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link to="/analytics" className="quick-action-card">
              <FaChartLine />
              <span>Analytics</span>
            </Link>
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