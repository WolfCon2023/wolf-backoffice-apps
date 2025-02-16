import { useState } from "react";
import axios from "axios";
import "./AppointmentScheduler.css"; // ✅ Import styles

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
      await axios.post("https://your-backend-url/api/appointments", appointment);
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
      console.error("Error scheduling appointment:", error);
      alert("Failed to schedule appointment.");
    }
  };

  return (
    <div className="scheduler-container">
      <h1 className="scheduler-title">Business Appointment Scheduler</h1>
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

        <button type="submit" className="submit-button">Add Appointment</button>
      </form>
    </div>
  );
};

export default AppointmentScheduler;
