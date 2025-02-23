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
    fetchAppointments();
  }, [currentPage]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found! Redirecting to login.");
        return;
      }

      console.log("🔍 Fetching appointments...");

      const defaultStartDate = new Date("1970-01-01").toISOString();
      const defaultEndDate = new Date("2100-01-01").toISOString();

      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: defaultStartDate, endDate: defaultEndDate },
      });

      console.log("✅ API Response:", response.data);

      if (!response.data || !Array.isArray(response.data)) {
        console.error("❌ Unexpected API response:", response.data);
        return;
      }

      const filteredAppointments = response.data.filter((appt) => !appt.toBeDeleted);

      setAppointments(filteredAppointments);
      setTotalPages(1); // Adjust if backend adds pagination support
      setIsQueryResults(false);
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
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

      const response = await axios.get(`${API_BASE_URL}/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: startISO, endDate: endISO },
      });

      console.log("✅ Historical Appointments Response:", response.data);

      if (!Array.isArray(response.data) || response.data.length === 0) {
        alert("No appointments found for the selected date range.");
      }

      setAppointments(response.data);
      setIsQueryResults(true);
    } catch (error) {
      console.error("❌ Error querying historical appointments:", error.response?.data || error.message);
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
        `${API_BASE_URL}/appointments/update/${selectedAppointment._id}`,
        updatedAppointment,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Appointment saved", response.data);
      fetchAppointments();
      closeModal();
    } catch (error) {
      console.error("❌ Error saving appointment", error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found");
        return;
      }

      // Instead of deleting, mark as `toBeDeleted: true`
      await axios.put(
        `${API_BASE_URL}/appointments/update/${id}`,
        { toBeDeleted: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Appointment marked as deleted");
      fetchAppointments();
    } catch (error) {
      console.error("❌ Error deleting appointment", error.response?.data || error.message);
    }
  };

  return (
    <Box className="appointments-dashboard-container">
      {/* Title and Query Section */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <h1>Appointments Dashboard</h1>
      </Box>

      <Box className="query-container" sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
        <TextField type="date" label="Start Date" variant="outlined" value={queryRange.startDate}
          onChange={(e) => setQueryRange({ ...queryRange, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
        <TextField type="date" label="End Date" variant="outlined" value={queryRange.endDate}
          onChange={(e) => setQueryRange({ ...queryRange, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={handleQuery}>Query Historical Appointments</Button>
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
                  <Button size="small" variant="outlined" onClick={() => handleDelete(appt._id)}>Delete</Button>
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
