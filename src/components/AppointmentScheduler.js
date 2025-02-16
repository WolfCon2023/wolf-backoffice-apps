import { useState } from "react";
import axios from "axios";
import "./AppointmentScheduler.css"; // ✅ Ensure styles are imported

// ✅ Load API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentScheduler = () => {
  const [appointment, setAppointment] = useState({
    title: "",
    date: "",
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    scheduledBy: "",
    notes: "",
  });

  const handleChange = (e) => {
    setAppointment({ ...appointment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting appointment to:", `${API_BASE_URL}/appointments`); // ✅ Debugging API URL
      console.log("Appointment Data:", appointment); // ✅ Debugging Request Data
      
      const response = await axios.post(`${API_BASE_URL}/appointments`, appointment);
      
      console.log("Response:", response.data); // ✅ Log API Response
      alert("Appointment scheduled successfully!");
      
      setAppointment({
        title: "",
        date: "",
        location: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        scheduledBy: "",
        notes: "",
      });
    } catch (error) {
      console.error("❌ Error scheduling appointment:", error.response ? error.response.data : error.message);
      alert(`Failed to schedule appointment: ${error.response?.data?.message || "Server error"}`);
    }
  };

  return (
    <div className="scheduler-container">
      <h1 className="scheduler-title">Business Appointment Scheduler</h1>
      <div className="scheduler-scrollable"> {/* ✅ Ensures form and button are inside a scrollable div */}
        <form className="scheduler-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" value={appointment.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input type="datetime-local" name="date" value={appointment.date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input type="text" name="location" value={appointment.location} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Contact Name</label>
            <input type="text" name="contactName" value={appointment.contactName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Contact Phone</label>
            <input type="text" name="contactPhone" value={appointment.contactPhone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Contact Email</label>
            <input type="email" name="contactEmail" value={appointment.contactEmail} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Scheduled By</label>
            <input type="text" name="scheduledBy" value={appointment.scheduledBy} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={appointment.notes} onChange={handleChange} />
          </div>

          {/* ✅ Move button into a div to prevent it from being hidden */}
          <div className="button-container">
            <button type="submit" className="submit-button">Add Appointment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
