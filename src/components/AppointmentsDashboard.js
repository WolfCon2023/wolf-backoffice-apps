import { useState, useEffect } from "react";
import axios from "axios";
import "./AppointmentsDashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentsDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [queryRange, setQueryRange] = useState({ startDate: "", endDate: "" });

  useEffect(() => {
    fetchAppointments();
  }, [currentPage]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found. Redirecting to login.");
        return;
      }
      console.log("✅ Sending API request to:", `${API_BASE_URL}/appointments`);
      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        params: { page: currentPage, limit: 50 },
      });

      console.log("✅ API Response:", response.data);
      if (response.data && response.data.appointments) {
        setAppointments(response.data.appointments);
        setTotalPages(response.data.totalPages);
        console.log("✅ Appointments state updated:", response.data.appointments);
      } else {
        console.warn("⚠️ API returned no appointments.");
      }
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
    }
  };

  const handleQuery = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      console.log("✅ Querying historical appointments from:", queryRange.startDate, "to", queryRange.endDate);
      const response = await axios.get(`${API_BASE_URL}/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: queryRange.startDate, endDate: queryRange.endDate },
      });
      console.log("✅ Historical Appointments Response:", response.data);
      setAppointments(response.data);
    } catch (error) {
      console.error("❌ Error querying historical appointments:", error.response?.data || error.message);
    }
  };

  return (
    <div className="appointments-dashboard-container">
      <h1>Appointments Dashboard</h1>
      <div className="query-container">
        <input
          type="date"
          value={queryRange.startDate}
          onChange={(e) => setQueryRange({ ...queryRange, startDate: e.target.value })}
        />
        <input
          type="date"
          value={queryRange.endDate}
          onChange={(e) => setQueryRange({ ...queryRange, endDate: e.target.value })}
        />
        <button onClick={handleQuery}>Query Historical Appointments</button>
      </div>
      <table className="appointments-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Location</th>
            <th>Scheduled By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? (
            appointments.map((appt) => (
              <tr key={appt._id}>
                <td>{appt.title}</td>
                <td>{new Date(appt.date).toLocaleString()}</td>
                <td>{appt.location || "N/A"}</td>
                <td>{appt.scheduledBy || "Unknown"}</td>
                <td>
                  <button>Edit</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: "red" }}>No appointments available.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default AppointmentsDashboard;
