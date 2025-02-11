import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div>
      <h1> Wolf Back Office Applications Menu</h1>
      <nav>
        <Link to="/appointments">Appointments</Link>
        <Link to="/calendar">Calendar</Link>
        <Link to="/customers">Customers</Link>
        <Link to="/crm">CRM</Link>
      </nav>
    </div>
  );
};

export default Dashboard;
