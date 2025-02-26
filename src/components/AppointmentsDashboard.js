import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "./AppointmentsDashboard.css";

// Material-UI imports
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentsDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [queryRange, setQueryRange] = useState({ startDate: "", endDate: "" });
  const [isQueryResults, setIsQueryResults] = useState(false);
  const navigate = useNavigate();

  // Fetch users for dropdown
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
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: new Date("1970-01-01").toISOString(),
          endDate: new Date("2100-01-01").toISOString(),
        },
      });

      if (!Array.isArray(response.data)) return;

      // Filter out deleted appointments
      const filteredAppointments = response.data.filter((appt) => !appt.toBeDeleted);

      setAppointments(filteredAppointments);
      setIsQueryResults(false);
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
    }
  };

  const handleQuery = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (!queryRange.startDate || !queryRange.endDate) {
        alert("Please select both start and end dates.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: new Date(queryRange.startDate).toISOString(),
          endDate: new Date(queryRange.endDate).toISOString(),
        },
      });

      if (!Array.isArray(response.data) || response.data.length === 0) {
        alert("No appointments found for the selected date range.");
      }

      setAppointments(response.data);
      setIsQueryResults(true);
    } catch (error) {
      console.error("❌ Error querying historical appointments:", error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const confirmDelete = window.confirm("Are you sure you want to delete this appointment?");
      if (!confirmDelete) return;

      await axios.delete(`${API_BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchAppointments();
    } catch (error) {
      console.error("❌ Error deleting appointment:", error.response?.data || error.message);
    }
  };

  return (
    <Box className="appointments-dashboard-container">
      <Box className="dashboard-header">
        <Box className="query-container">
          <TextField
            type="date"
            label="Start Date"
            variant="outlined"
            value={queryRange.startDate}
            onChange={(e) => setQueryRange({ ...queryRange, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="End Date"
            variant="outlined"
            value={queryRange.endDate}
            onChange={(e) => setQueryRange({ ...queryRange, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={handleQuery}>
            Submit
          </Button>
        </Box>

        <h1 className="dashboard-title">Appointments Dashboard</h1>

        <Box className="nav-buttons">
          <Button component={Link} to="/schedule-appointment" variant="contained">
            Appointment Scheduler
          </Button>
          <Button component={Link} to="/calendar" variant="contained">
            Success Calendar
          </Button>
          <IconButton color="primary" onClick={fetchAppointments}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table className="appointments-table">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Scheduled By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appt) => (
              <TableRow key={appt._id}>
                <TableCell>{appt.title}</TableCell>
                <TableCell>{new Date(appt.date).toLocaleString()}</TableCell>
                <TableCell>{appt.location}</TableCell>
                <TableCell>{users.find((u) => u._id === appt.scheduledBy)?.firstName || "Unknown"}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/appointment/${appt._id}`)}>Edit/View</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(appt._id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AppointmentsDashboard;
