import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import Appointments from "./components/Appointments";
import AppointmentScheduler from "./components/AppointmentScheduler";
import Calendar from "./components/Calendar";
import CustomerCRM from "./components/CustomerCRM";
import CustomerDetails from "./components/CustomerDetails";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer"; // ✅ Import Footer component

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={authToken ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setAuthToken={setAuthToken} />} />
          <Route path="/appointments" element={authToken ? <Appointments /> : <Navigate to="/login" />} />
          <Route path="/schedule-appointment" element={authToken ? <AppointmentScheduler /> : <Navigate to="/login" />} />
          <Route path="/calendar" element={authToken ? <Calendar /> : <Navigate to="/login" />} />
          <Route path="/customers" element={authToken ? <CustomerCRM /> : <Navigate to="/login" />} />
          <Route path="/customer/:id" element={authToken ? <CustomerDetails /> : <Navigate to="/login" />} />
        </Routes>
        
        <Footer /> {/* ✅ Add Footer so it appears on every page */}
      </div>
    </Router>
  );
}

export default App;