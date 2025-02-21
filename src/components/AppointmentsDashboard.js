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

      console.log("✅ Raw API Response:", response.data.appointments);

      // ✅ Filter out soft-deleted records
      const filteredAppointments = response.data.appointments.filter(appt => !appt.toBeDeleted);
      
      console.log("✅ Filtered Appointments (Removing Deleted):", filteredAppointments);

      setAppointments(filteredAppointments);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) {
      console.error("❌ No appointment selected for deletion.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("🔍 Token Retrieved for Delete:", token);

      if (!token) {
        console.error("❌ No token found. User must be authenticated.");
        return;
      }

      console.log("🔍 Marking appointment as deleted:", deleteConfirmation);

      // ✅ Convert DELETE into a PUT request to set `toBeDeleted: true`
      const response = await axios.put(
        `${API_BASE_URL}/appointments/${deleteConfirmation}`, 
        { toBeDeleted: true }, // ✅ Updating the flag
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Appointment marked as deleted:", response.data);

      // ✅ Immediately remove the deleted appointment from state
      setAppointments(prevAppointments => prevAppointments.filter(appt => appt._id !== deleteConfirmation));

      setDeleteConfirmation(null); // Clear confirmation state
    } catch (error) {
      console.error("❌ Error marking appointment as deleted:", error.response?.data || error.message);
    }
  };

  const handleSave = async () => {
    if (!selectedAppointment) return;
    try {
      const token = localStorage.getItem("token");
      console.log("🔍 Retrieved Token for Save:", token);

      if (!token) {
        alert("❌ No token found. Redirecting to login.");
        return;
      }

      console.log("🔍 Sending Appointment to:", `${API_BASE_URL}/appointments`);
      console.log("🔍 Request Body:", JSON.stringify(selectedAppointment, null, 2));

      const response = await axios.put(`${API_BASE_URL}/appointments/${selectedAppointment._id}`, selectedAppointment, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Appointment updated successfully!", response.data);
      fetchAppointments();
      closeModal();
    } catch (error) {
      console.error("❌ Error saving appointment:", error.response?.data || error.message);
      alert(`Failed to update appointment: ${error.response?.data?.message || "Server error"}`);
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

  return (
    <div className="appointments-dashboard-container">
      <h1>Appointments Dashboard</h1>
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

      {deleteConfirmation && (
        <div className="delete-confirmation-container">
          <div className="delete-confirmation-box">
            <p>Click confirm to delete or exit to cancel</p>
            <button className="confirm-delete" onClick={handleDelete}>Confirm</button>
            <button className="cancel-delete" onClick={() => setDeleteConfirmation(null)}>X</button>
          </div>
        </div>
      )}

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
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, title: e.target.value })} 
              disabled={viewMode === "view"} 
            />

            <label>Date:</label>
            <input 
              type="datetime-local" 
              name="date" 
              value={selectedAppointment.date} 
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, date: e.target.value })} 
              disabled={viewMode === "view"} 
            />

            <label>Location:</label>
            <input 
              type="text" 
              name="location" 
              value={selectedAppointment.location} 
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, location: e.target.value })} 
              disabled={viewMode === "view"} 
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
              onChange={(e) => setSelectedAppointment({ ...selectedAppointment, notes: e.target.value })} 
              disabled={viewMode === "view"} 
            />

            {viewMode === "edit" && <button onClick={handleSave}>Save</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsDashboard;
