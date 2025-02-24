import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "./AppointmentsDashboard.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Material‑UI imports
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentsDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("");
  const [queryRange, setQueryRange] = useState({ startDate: "", endDate: "" });

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
      setAppointments(response.data.filter((appt) => !appt.toBeDeleted));
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to mark this appointment as deleted?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${API_BASE_URL}/appointments/${id}`,
        { toBeDeleted: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchAppointments();
    } catch (error) {
      console.error("❌ Error deleting appointment:", error.response?.data || error.message);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const updatedAppointment = {
        ...selectedAppointment,
        date: selectedAppointment.date ? new Date(selectedAppointment.date).toISOString() : null,
      };

      await axios.put(
        `${API_BASE_URL}/appointments/${selectedAppointment._id}`,
        updatedAppointment,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchAppointments();
      closeModal();
    } catch (error) {
      console.error("❌ Error saving appointment", error.response?.data || error.message);
    }
  };

  const openModal = (appointment, mode) => {
    setSelectedAppointment({
      ...appointment,
      date: appointment.date ? new Date(appointment.date) : null,
    });
    setViewMode(mode);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setViewMode("");
  };

  return (
    <Box className="appointments-dashboard-container">
      {/* Header */}
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
          <Button variant="contained" onClick={fetchAppointments}>
            Query Historical Appointments
          </Button>
        </Box>

        <h1 className="dashboard-title">Appointments Dashboard</h1>

        <Box className="nav-buttons">
          <Button component={Link} to="/schedule-appointment" variant="contained">
            Appointment Scheduler
          </Button>
          <Button component={Link} to="/calendar" variant="contained">
            Calendar
          </Button>
          <IconButton color="primary" onClick={fetchAppointments}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Table */}
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
                  <Button size="small" variant="outlined" onClick={() => openModal(appt, "edit")}>Edit</Button>
                  <Button size="small" variant="outlined" onClick={() => openModal(appt, "view")}>View</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(appt._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Edit/View */}
      <Dialog open={!!selectedAppointment} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>
          {viewMode === "edit" ? "Edit Appointment" : "View Appointment"}
          <IconButton aria-label="close" onClick={closeModal} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Title" fullWidth value={selectedAppointment?.title || ""} disabled={viewMode === "view"} />
            </Grid>
            <Grid item xs={12}>
              <DatePicker selected={selectedAppointment?.date} onChange={(date) => setSelectedAppointment({ ...selectedAppointment, date })} disabled={viewMode === "view"} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Location" fullWidth value={selectedAppointment?.location || ""} disabled={viewMode === "view"} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {viewMode === "edit" && <Button onClick={handleSave}>Save</Button>}
          <Button onClick={closeModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsDashboard;
