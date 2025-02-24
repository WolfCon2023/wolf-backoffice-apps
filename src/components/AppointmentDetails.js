import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
} from "@mui/material";
import "./AppointmentDetails.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState({
    title: "",
    date: null,
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    scheduledBy: "",
    notes: "",
  });

  // Fetch Users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  useEffect(() => {
    fetchAppointmentDetails();
  }, []);

  const fetchAppointmentDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setAppointment({
          ...response.data,
          date: response.data.date ? new Date(response.data.date) : null,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching appointment details:", error.response?.data || error.message);
    }
  };

  const handleChange = (event) => {
    setAppointment({
      ...appointment,
      [event.target.name]: event.target.value,
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const updatedAppointment = {
        ...appointment,
        date: appointment.date ? new Date(appointment.date).toISOString() : null,
      };

      await axios.put(
        `${API_BASE_URL}/appointments/${id}`,
        updatedAppointment,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Appointment updated successfully!");
      navigate("/appointments");
    } catch (error) {
      console.error("❌ Error updating appointment:", error.response?.data || error.message);
      alert("❌ Failed to update appointment.");
    }
  };

  return (
    <Box className="appointment-details-container">
      <Paper className="appointment-details-paper">
        <Typography variant="h4" className="appointment-details-title">
          Edit Appointment
        </Typography>

        <TextField
          label="Title"
          name="title"
          value={appointment.title}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <DatePicker
          selected={appointment.date}
          onChange={(date) => setAppointment({ ...appointment, date })}
          className="date-picker"
          showTimeSelect
          dateFormat="Pp"
          placeholderText="Select date"
        />

        <TextField
          select
          label="Scheduled By"
          name="scheduledBy"
          value={appointment.scheduledBy}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          {users.map((user) => (
            <MenuItem key={user._id} value={user._id}>
              {`${user.firstName} ${user.lastName}`}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Location"
          name="location"
          value={appointment.location}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Contact Name"
          name="contactName"
          value={appointment.contactName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Contact Phone"
          name="contactPhone"
          value={appointment.contactPhone}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Contact Email"
          name="contactEmail"
          value={appointment.contactEmail}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Notes"
          name="notes"
          value={appointment.notes}
          onChange={handleChange}
          multiline
          rows={3}
          fullWidth
          margin="normal"
        />

        <Box className="modal-buttons">
          <Button variant="contained" color="primary" onClick={handleSave}>
            Submit
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate("/appointments")}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AppointmentDetails;
