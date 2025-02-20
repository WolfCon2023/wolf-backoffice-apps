import { useState, useEffect } from "react";
import axios from "axios";
import "./AppointmentsDashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentsDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [queryRange, setQueryRange] = useState({ startDate: "", endDate: "" });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("");
  const [isQueryResults, setIsQueryResults] = useState(false);

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
      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 50 },
      });
      console.log("✅ API Response:", response.data);
      setAppointments(response.data.appointments);
      setTotalPages(response.data.totalPages);
      setIsQueryResults(false);
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
    }
  };

  const handleQuery = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: queryRange.startDate, endDate: queryRange.endDate },
      });
      setAppointments(response.data);
      setIsQueryResults(true);
    } catch (error) {
      console.error("❌ Error querying historical appointments:", error.response?.data || error.message);
    }
  };

  const openModal = (appointment, mode) => {
    setSelectedAppointment({ ...appointment, date: new Date(appointment.date).toISOString().slice(0, 16) });
    setViewMode(mode);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setViewMode("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedAppointment((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.put(`${API_BASE_URL}/appointments/${selectedAppointment._id}`, selectedAppointment, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Appointment updated successfully!", response.data);
      fetchAppointments();
      closeModal();
    } catch (error) {
      console.error("❌ Error saving appointment:", error.response?.data || error.message);
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
      {isQueryResults && (
        <button onClick={fetchAppointments} className="back-button">Back to Dashboard</button>
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
              </td>
            </tr>
          ))}
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
      {selectedAppointment && (
        <div className="edit-container">
          <div className="edit-box">
            <button className="close-button" onClick={closeModal}>Close</button>
            <h2>{viewMode === "edit" ? "Edit Appointment" : "View Appointment"}</h2>
            <input type="text" name="title" value={selectedAppointment.title} onChange={handleInputChange} disabled={viewMode === "view"} />
            <input type="datetime-local" name="date" value={selectedAppointment.date} onChange={handleInputChange} disabled={viewMode === "view"} />
            <input type="text" name="location" value={selectedAppointment.location} onChange={handleInputChange} disabled={viewMode === "view"} />
            <input type="text" name="scheduledBy" value={selectedAppointment.scheduledBy} disabled />
            <textarea name="notes" value={selectedAppointment.notes} onChange={handleInputChange} disabled={viewMode === "view"} />
            {viewMode === "edit" && <button onClick={handleSave}>Save</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsDashboard;
