import { useState, useEffect } from "react";
import axios from "axios";
import "./AppointmentScheduler.css"; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentScheduler = () => {
  const [appointment, setAppointment] = useState({
    title: "",
    date: "",
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    scheduledByUserId: "", // ✅ Store user ID instead of full name
    notes: "",
  });

  const [users, setUsers] = useState([]); // ✅ Store user list

  // ✅ Fetch users when the component loads
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token"); // ✅ Retrieve token
        if (!token) {
          console.warn("❌ No token found. Redirecting to login.");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }, // ✅ Include token
        });

        console.log("✅ Users fetched (Before State Update):", response.data);
        setUsers((prevUsers) => {
          console.log("✅ Previous users state:", prevUsers);
          console.log("✅ New users state:", response.data);
          return response.data;
        }); // ✅ Update state
        console.log("✅ Users state updated:", response.data);
      } catch (error) {
        console.error("❌ Error fetching users:", error.response?.data || error.message);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setAppointment({ ...appointment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting appointment to:", `${API_BASE_URL}/appointments`); 

      const response = await axios.post(`${API_BASE_URL}/appointments`, appointment);
      
      console.log("Response:", response.data); 
      alert("Appointment scheduled successfully!");
      
      setAppointment({
        title: "",
        date: "",
        location: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        scheduledByUserId: "", // ✅ Reset user selection
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
      <div className="scheduler-scrollable">
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
            <select name="scheduledByUserId" value={appointment.scheduledByUserId} onChange={handleChange} required>
              <option value="">Select User</option>
              {users.length > 0 ? (
                users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))
              ) : (
                <option disabled>Loading users...</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={appointment.notes} onChange={handleChange} />
          </div>

          <div className="button-container">
            <button type="submit" className="submit-button">Add Appointment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
