import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; 
import Login from "./components/Login";
import AppointmentsDashboard from "./components/AppointmentsDashboard";
import AppointmentScheduler from "./components/AppointmentScheduler";
import Calendar from "./components/Calendar";
import CustomerCRM from "./components/CustomerCRM";
import CustomerDetails from "./components/CustomerDetails";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import Header from "./components/Header";

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setUsername(decodedToken.username);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [authToken]);

  return (
    <Router>
      <div className="app-container">
        <Header username={username} setAuthToken={setAuthToken} />
        <Routes>
          <Route path="/" element={authToken ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setAuthToken={setAuthToken} />} />
          <Route path="/dashboard" element={authToken ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/appointments" element={authToken ? <AppointmentsDashboard /> : <Navigate to="/login" />} />
          <Route path="/schedule-appointment" element={authToken ? <AppointmentScheduler /> : <Navigate to="/login" />} />
          <Route path="/calendar" element={authToken ? <Calendar /> : <Navigate to="/login" />} />
          <Route path="/customers" element={authToken ? <CustomerCRM /> : <Navigate to="/login" />} />
          <Route path="/customer/:id" element={authToken ? <CustomerDetails /> : <Navigate to="/login" />} />
        </Routes>
        <Footer username={username} />
      </div>
    </Router>
  );
}

export default App;
