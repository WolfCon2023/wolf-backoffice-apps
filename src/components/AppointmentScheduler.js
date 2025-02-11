import { useState } from "react";
import axios from "axios";

const AppointmentScheduler = () => {
  const [appointment, setAppointment] = useState({
    title: "",
    date: "",
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    scheduledBy: "",
    notes: ""
  });

  const handleChange = (e) => {
    setAppointment({ ...appointment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://your-backend-url/api/appointments", appointment);
      alert("Appointment scheduled successfully!");
      setAppointment({ title: "", date: "", location: "", contactName: "", contactPhone: "", contactEmail: "", scheduledBy: "", notes: "" });
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      alert("Failed to schedule appointment.");
    }
  };

  return (
    <div>
      <h1>Business Appointment Scheduler</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Title" value={appointment.title} onChange={handleChange} required />
        <input type="datetime-local" name="date" value={appointment.date} onChange={handleChange} required />
        <input type="text" name="location" placeholder="Location" value={appointment.location} onChange={handleChange} />
        <input type="text" name="contactName" placeholder="Contact Name" value={appointment.contactName} onChange={handleChange} />
        <input type="text" name="contactPhone" placeholder="Phone" value={appointment.contactPhone} onChange={handleChange} />
        <input type="email" name="contactEmail" placeholder="Email" value={appointment.contactEmail} onChange={handleChange} />
        <input type="text" name="scheduledBy" placeholder="Scheduled By" value={appointment.scheduledBy} onChange={handleChange} required />
        <textarea name="notes" placeholder="Notes" value={appointment.notes} onChange={handleChange} />
        <button type="submit">Add Appointment</button>
      </form>
    </div>
  );
};

export default AppointmentScheduler;
