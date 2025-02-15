import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div>
      <h1>Wolf Back Office Applications Menu</h1>
      <nav>
        <ul>
          <li><Link to="/appointments">Appointments</Link></li>
          <li><Link to="/schedule-appointment">Schedule Appointment</Link></li>
          <li><Link to="/calendar">Calendar</Link></li>
          <li><Link to="/customers">Customers</Link></li>
          <li><Link to="/crm">CRM</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Dashboard;