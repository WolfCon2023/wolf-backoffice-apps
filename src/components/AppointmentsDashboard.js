import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "./AppointmentsDashboard.css";

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
  Pagination,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentsDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("");
  const [queryRange, setQueryRange] = useState({ startDate: "", endDate: "" });
  const [isQueryResults, setIsQueryResults] = useState(false);

  // Fetch users for the Scheduled By dropdown
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
    console.log("🔍 Component Mounted. Fetching appointments...");
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found! Redirecting to login.");
        return;
      }
      console.log("🔍 Fetching appointments...");

      // Use default date range to fetch all appointments
      const defaultStartDate = new Date("1970-01-01").toISOString();
      const defaultEndDate = new Date("2100-01-01").toISOString();

      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 10,
          startDate: defaultStartDate,
          endDate: defaultEndDate,
        },
      });

      console.log("✅ API Response:", response.data);

      if (!response.data || !response.data.appointments) {
        console.error("❌ Unexpected API response:", response.data);
        return;
      }

      const filteredAppointments = response.data.appointments.filter(
        (appt) => !appt.toBeDeleted
      );
      console.log("✅ Appointments Retrieved:", filteredAppointments);

      setAppointments(filteredAppointments);
      setTotalPages(response.data.totalPages || 1);
      setIsQueryResults(false);
    } catch (error) {
      console.error(
        "❌ Error fetching appointments:",
        error.response?.data || error.message
      );
    }
  };

  const handleQuery = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found. Cannot query historical appointments.");
        return;
      }

      if (!queryRange.startDate || !queryRange.endDate) {
        alert("Please select both start and end dates.");
        return;
      }

      console.log("🔍 Querying historical appointments:", queryRange);

      const startISO = new Date(queryRange.startDate).toISOString();
      const endISO = new Date(queryRange.endDate).toISOString();

      console.log("🔍 Sending Request with Start:", startISO, "End:", endISO);

      const response = await axios.get(`${API_BASE_URL}/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: startISO, endDate: endISO },
      });

      console.log("✅ Historical Appointments Response:", response.data);

      if (response.data.length === 0) {
        alert("No appointments found for the selected date range.");
      }

      setAppointments(response.data);
      setIsQueryResults(true);
    } catch (error) {
      console.error(
        "❌ Error querying historical appointments:",
        error.response?.data || error.message
      );
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found");
        return;
      }
      const updatedAppointment = {
        ...selectedAppointment,
        date: new Date(selectedAppointment.date).toISOString(),
      };
      const response = await axios.put(
        `${API_BASE_URL}/appointments/${selectedAppointment._id}`,
        updatedAppointment,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Appointment saved", response.data);
      fetchAppointments();
      closeModal();
    } catch (error) {
      console.error(
        "Error saving appointment",
        error.response?.data || error.message
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found");
        return;
      }
      await axios.delete(`${API_BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Appointment deleted");
      fetchAppointments();
    } catch (error) {
      console.error(
        "Error deleting appointment",
        error.response?.data || error.message
      );
    }
  };

  const openModal = (appointment, mode) => {
    console.log(`📝 Opening ${mode} mode for`, appointment);
    setSelectedAppointment({
      ...appointment,
      date: new Date(appointment.date).toISOString().slice(0, 16),
    });
    setViewMode(mode);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setViewMode("");
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // When returning to dashboard, reset page to 1 and clear query results
  const handleBackToDashboard = () => {
    setIsQueryResults(false);
    setCurrentPage(1);
    fetchAppointments();
  };

  return (
    <Box className="appointments-dashboard-container">
      {/* Navigation Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        {/* Left column: Appointment Scheduler with a slight left shift */}
       {/* Navigation Bar */}
       <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
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

      {/* Title centered */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <h1>Appointments Dashboard</h1>
      </Box>

      {/* Query Section centered */}
      <Box
        className="query-container"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mb: 2 }}
      >
        <TextField
          type="date"
          label="Start Date"
          variant="outlined"
          value={queryRange.startDate}
          onChange={(e) =>
            setQueryRange({ ...queryRange, startDate: e.target.value })
          }
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          variant="outlined"
          value={queryRange.endDate}
          onChange={(e) =>
            setQueryRange({ ...queryRange, endDate: e.target.value })
          }
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={handleQuery}>
          Query Historical Appointments
        </Button>
      </Box>

      {isQueryResults && (
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBackToDashboard}
            className="back-button"
          >
            Back to Dashboard
          </Button>
        </Box>
      )}

      {/* Appointments Table */}
      <TableContainer component={Paper}>
        <Table className="appointments-table" aria-label="appointments table">
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
                <TableCell>
                  {users.find((u) => u._id === appt.scheduledBy)
                    ? `${users.find((u) => u._id === appt.scheduledBy).firstName} ${users.find((u) => u._id === appt.scheduledBy).lastName}`
                    : appt.scheduledBy}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openModal(appt, "edit")}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openModal(appt, "view")}
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(appt._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination (only when not in query mode) */}
      {!isQueryResults && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Modal / Dialog for Appointment Details */}
      <Dialog
        open={Boolean(selectedAppointment)}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {viewMode === "edit" ? "Edit Appointment" : "View Appointment"}
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            value={selectedAppointment?.title || ""}
            onChange={(e) =>
              setSelectedAppointment({
                ...selectedAppointment,
                title: e.target.value,
              })
            }
            InputProps={{ readOnly: viewMode === "view" }}
          />
          <TextField
            margin="dense"
            label="Date"
            type="datetime-local"
            fullWidth
            value={selectedAppointment?.date || ""}
            onChange={(e) =>
              setSelectedAppointment({
                ...selectedAppointment,
                date: e.target.value,
              })
            }
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: viewMode === "view" }}
          />
          <TextField
            margin="dense"
            label="Location"
            type="text"
            fullWidth
            value={selectedAppointment?.location || ""}
            onChange={(e) =>
              setSelectedAppointment({
                ...selectedAppointment,
                location: e.target.value,
              })
            }
            InputProps={{ readOnly: viewMode === "view" }}
          />
          {/* Scheduled By as a dropdown */}
          <TextField
            select
            margin="dense"
            label="Scheduled By"
            fullWidth
            value={selectedAppointment?.scheduledBy || ""}
            onChange={(e) =>
              setSelectedAppointment({
                ...selectedAppointment,
                scheduledBy: e.target.value,
              })
            }
            disabled={viewMode === "view"}
          >
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {`${user.firstName} ${user.lastName}`}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Notes"
            type="text"
            fullWidth
            multiline
            minRows={3}
            value={selectedAppointment?.notes || ""}
            onChange={(e) =>
              setSelectedAppointment({
                ...selectedAppointment,
                notes: e.target.value,
              })
            }
            InputProps={{ readOnly: viewMode === "view" }}
          />
        </DialogContent>
        <DialogActions>
          {viewMode === "edit" && (
            <Button onClick={handleSave} variant="contained">
              Save
            </Button>
          )}
          <Button onClick={closeModal} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsDashboard;