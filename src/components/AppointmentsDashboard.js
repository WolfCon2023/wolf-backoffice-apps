import { useState, useEffect } from "react";
import axios from "axios";
import "./AppointmentsDashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentsDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [queryRange, setQueryRange] = useState({ startDate: "", endDate: "" });
  const [isQueryResults, setIsQueryResults] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found. Redirecting to login.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 50 },
      });

      console.log("✅ Raw API Response:", response.data.appointments);

      const filteredAppointments = response.data.appointments.filter(appt => !appt.toBeDeleted);

      console.log("✅ Filtered Appointments (Removing Deleted):", filteredAppointments);

      setAppointments(filteredAppointments);
      setTotalPages(response.data.totalPages);
      setIsQueryResults(false);
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
    }
  };

  const handleQuery = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found. Cannot query historical appointments.");
        return;
      }

      if (!queryRange.startDate || !queryRange.endDate) {
        alert("Please select both start and end dates.");
        return;
      }

      console.log("🔍 Querying historical appointments:", queryRange);

      const startISO = new Date(queryRange.startDate).toISOString();
      const endISO = new Date(queryRange.endDate).toISOString();

      console.log("🔍 Sending Request with Start:", startISO, "End:", endISO);

      const response = await axios.get(`${API_BASE_URL}/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: startISO, endDate: endISO },
      });

      console.log("✅ Historical Appointments Response:", response.data);

      if (response.data.length === 0) {
        alert("No appointments found for the selected date range.");
      }

      setAppointments(response.data);
      setIsQueryResults(true);
    } catch (error) {
      console.error("❌ Error querying historical appointments:", error.response?.data || error.message);
    }
  };

  return (
    <div className="appointments-dashboard-container">
      <h1>Appointments Dashboard</h1>

      <div className="query-container">
        <input type="date" value={queryRange.startDate} onChange={(e) => setQueryRange({ ...queryRange, startDate: e.target.value })} />
        <input type="date" value={queryRange.endDate} onChange={(e) => setQueryRange({ ...queryRange, endDate: e.target.value })} />
        <button onClick={handleQuery}>Query Historical Appointments</button>
      </div>

      {isQueryResults && (
        <button onClick={() => { setIsQueryResults(false); fetchAppointments(); }} className="back-button">
          Back to Dashboard
        </button>
      )}

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
          {appointments.map((appt) => (
            <tr key={appt._id}>
              <td>{appt.title}</td>
              <td>{new Date(appt.date).toLocaleString()}</td>
              <td>{appt.location}</td>
              <td>{appt.scheduledBy}</td>
              <td>
                <button onClick={() => setSelectedAppointment(appt)}>Edit</button>
                <button onClick={() => setSelectedAppointment(appt)}>View</button>
                <button onClick={() => setDeleteConfirmation(appt._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentsDashboard;
