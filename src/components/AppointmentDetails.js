import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentDetails.css";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
} from "@mui/material";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAppointmentDetails();
    fetchUsers();
  }, []);

  const fetchAppointmentDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setAppointment(response.data);
      }
    } catch (error) {
      console.error("Error fetching appointment details:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found.");
        alert("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!appointment || !appointment._id) {
        console.error("No appointment ID found.");
        alert("Error: Appointment ID is missing.");
        return;
      }

      console.log("Sending update request for appointment:", appointment);

      const updatedAppointment = {
        ...appointment,
        date: appointment.date ? new Date(appointment.date).toISOString() : null,
      };

      const response = await axios.put(
        `${API_BASE_URL}/appointments/${appointment._id}`,
        updatedAppointment,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Appointment updated successfully:", response.data);
      alert("Appointment updated successfully!");

      // Refresh the page to reflect the changes
      navigate("/appointments"); 
      window.location.reload();
      
    } catch (error) {
      console.error("Error saving appointment:", error.response?.data || error.message);
      alert("Error updating appointment. Please try again.");
    }
  };

  if (!appointment) {
    return <Typography className="loading-text">Loading...</Typography>;
  }

  return (
    <Paper className="appointment-details-container">
      <Typography variant="h4" className="appointment-title">
        Appointment Details
      </Typography>
      <Box className="form-container">
        <TextField
          label="Title"
          variant="outlined"
          fullWidth
          value={appointment.title || ""}
          onChange={(e) => setAppointment({ ...appointment, title: e.target.value })}
        />
        <DatePicker
          selected={appointment.date ? new Date(appointment.date) : null}
          onChange={(date) => setAppointment({ ...appointment, date })}
          showTimeSelect
          dateFormat="Pp"
          className="date-picker"
        />
        <TextField
          label="Location"
          variant="outlined"
          fullWidth
          value={appointment.location || ""}
          onChange={(e) => setAppointment({ ...appointment, location: e.target.value })}
        />
        <TextField
          select
          label="Scheduled By"
          variant="outlined"
          fullWidth
          value={appointment.scheduledBy || ""}
          onChange={(e) => setAppointment({ ...appointment, scheduledBy: e.target.value })}
        >
          {users.map((user) => (
            <MenuItem key={user._id} value={user._id}>
              {`${user.firstName} ${user.lastName}`}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Contact Name"
          variant="outlined"
          fullWidth
          value={appointment.contactName || ""}
          onChange={(e) => setAppointment({ ...appointment, contactName: e.target.value })}
        />
        <TextField
          label="Contact Phone"
          variant="outlined"
          fullWidth
          value={appointment.contactPhone || ""}
          onChange={(e) => setAppointment({ ...appointment, contactPhone: e.target.value })}
        />
        <TextField
          label="Contact Email"
          variant="outlined"
          fullWidth
          value={appointment.contactEmail || ""}
          onChange={(e) => setAppointment({ ...appointment, contactEmail: e.target.value })}
        />
        <TextField
          label="Notes"
          variant="outlined"
          fullWidth
          multiline
          minRows={4}
          value={appointment.notes || ""}
          onChange={(e) => setAppointment({ ...appointment, notes: e.target.value })}
          className="notes-field"
        />
      </Box>
      <Box className="button-container">
        <Button variant="contained" onClick={handleSave} className="save-button">
          Save
        </Button>
        <Button variant="outlined" onClick={() => navigate("/appointments")}>
          Cancel
        </Button>
      </Box>
    </Paper>
  );
};

export default AppointmentDetails;
