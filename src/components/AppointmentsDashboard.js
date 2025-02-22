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
    console.log("✅ Using API URL:", API_BASE_URL);
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found. Redirecting to login.");
        return;
      }

      console.log("🔍 Fetching appointments...");

      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 50 },
      });

      console.log("✅ API Response:", response.data);

      if (!response.data || !response.data.appointments) {
        console.error("❌ Unexpected API response:", response.data);
        return;
      }

      const filteredAppointments = response.data.appointments.filter(appt => !appt.toBeDeleted);
      console.log("✅ Appointments Retrieved:", filteredAppointments);

      setAppointments(filteredAppointments);
      setTotalPages(response.data.totalPages || 1);
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

  const openModal = (appointment, mode) => {
    console.log(`📝 Opening ${mode} mode for`, appointment);
    setSelectedAppointment({
      ...appointment,
      date: new Date(appointment.date).toISOString().slice(0, 16),
    });
    setViewMode(mode);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setViewMode("");
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
                <button onClick={() => openModal(appt, "edit")}>Edit</button>
                <button onClick={() => openModal(appt, "view")}>View</button>
                <button onClick={() => setDeleteConfirmation(appt._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ MODAL DISPLAY LOGIC (Only shows when `selectedAppointment` is set) */}
      {selectedAppointment && (
        <div className="edit-container">
          <div className="edit-box">
            <button className="close-button" onClick={closeModal}>Close</button>
            <h2>{viewMode === "edit" ? "Edit Appointment" : "View Appointment"}</h2>

            <label>Title:</label>
            <input 
              type="text" 
              name="title" 
              value={selectedAppointment.title} 
              disabled={viewMode === "view"} 
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, title: e.target.value })}
            />

            <label>Date:</label>
            <input 
              type="datetime-local" 
              name="date" 
              value={selectedAppointment.date} 
              disabled={viewMode === "view"} 
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, date: e.target.value })}
            />

            <label>Location:</label>
            <input 
              type="text" 
              name="location" 
              value={selectedAppointment.location} 
              disabled={viewMode === "view"} 
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, location: e.target.value })}
            />

            <label>Scheduled By:</label>
            <input 
              type="text" 
              name="scheduledBy" 
              value={selectedAppointment.scheduledBy} 
              disabled 
            />

            <label>Notes:</label>
            <textarea 
              name="notes" 
              value={selectedAppointment.notes} 
              disabled={viewMode === "view"} 
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, notes: e.target.value })}
            />

            {viewMode === "edit" && <button onClick={() => console.log("📝 Saving Appointment...", selectedAppointment)}>Save</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsDashboard;