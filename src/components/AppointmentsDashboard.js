import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
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
  Chip,
  Tooltip,
  CircularProgress,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  ButtonGroup,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterListIcon from "@mui/icons-material/FilterList";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const AppointmentsDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [queryRange, setQueryRange] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterLocation, setFilterLocation] = useState("all");
  const [dateRangePreset, setDateRangePreset] = useState("custom");
  const navigate = useNavigate();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize with last 3 months and next 3 months range
  useEffect(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    setQueryRange({
      startDate: threeMonthsAgo.toISOString().split('T')[0],
      endDate: threeMonthsFromNow.toISOString().split('T')[0]
    });
  }, []);

  // Fetch users for dropdown
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onError: (error) => {
      toast.error("Failed to load users: " + (error.response?.data?.message || error.message));
    }
  });

  useEffect(() => {
    if (queryRange.startDate && queryRange.endDate) {
      fetchAppointments();
    }
  }, [queryRange.startDate, queryRange.endDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to view appointments");
        return;
      }

      const startDateTime = new Date(queryRange.startDate);
      startDateTime.setHours(0, 0, 0, 0);

      const endDateTime = new Date(queryRange.endDate);
      endDateTime.setHours(23, 59, 59, 999);

      const response = await axios.get(`${API_BASE_URL}/appointments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
        },
      });

      if (!Array.isArray(response.data)) {
        toast.error("Invalid data received from server");
        return;
      }

      const filteredAppointments = response.data
        .filter((appt) => !appt.toBeDeleted)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setAppointments(filteredAppointments);
      toast.success(`Found ${filteredAppointments.length} appointments`);
    } catch (error) {
      toast.error("Failed to fetch appointments: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = () => {
    if (!queryRange.startDate || !queryRange.endDate) {
      toast.warning("Please select both start and end dates");
      return;
    }

    const start = new Date(queryRange.startDate);
    const end = new Date(queryRange.endDate);

    if (start > end) {
      toast.warning("Start date cannot be after end date");
      return;
    }

    // Validate date range is not more than 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end - start > oneYear) {
      toast.warning("Date range cannot exceed 1 year");
      return;
    }

    fetchAppointments();
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to delete appointments");
        return;
      }

      const confirmDelete = window.confirm("Are you sure you want to delete this appointment?");
      if (!confirmDelete) return;

      await axios.delete(`${API_BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Appointment deleted successfully");
      fetchAppointments();
    } catch (error) {
      toast.error("Failed to delete appointment: " + (error.response?.data?.message || error.message));
    }
  };

  const locations = ["all", ...new Set(appointments.map(appt => appt.location))];

  const getAppointmentStatus = (date) => {
    const appointmentDate = new Date(date);
    const now = new Date();
    
    if (appointmentDate < now) {
      return <Chip label="Completed" color="success" size="small" />;
    } else if (
      appointmentDate.getDate() === now.getDate() &&
      appointmentDate.getMonth() === now.getMonth() &&
      appointmentDate.getFullYear() === now.getFullYear()
    ) {
      return <Chip label="Today" color="primary" size="small" />;
    } else {
      return <Chip label="Upcoming" color="info" size="small" />;
    }
  };

  const handleDateRangePreset = (preset) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        break;
      case 'thisWeek':
        start.setDate(now.getDate() - now.getDay());
        end.setDate(now.getDate() + (6 - now.getDay()));
        break;
      case 'thisMonth':
        start.setDate(1);
        end.setMonth(now.getMonth() + 1, 0);
        break;
      default:
        return;
    }

    setDateRangePreset(preset);
    setQueryRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box className="appointments-dashboard-container" sx={{ mb: 4, px: 3, py: 2 }}>
      {/* Date Range and Search Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            textAlign: 'center',
            fontWeight: 500,
            mb: 2
          }}
        >
          Appointments Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ButtonGroup 
            variant="outlined" 
            size="small"
          >
            <Button
              onClick={() => handleDateRangePreset('today')}
              variant={dateRangePreset === 'today' ? 'contained' : 'outlined'}
            >
              TODAY
            </Button>
            <Button
              onClick={() => handleDateRangePreset('thisWeek')}
              variant={dateRangePreset === 'thisWeek' ? 'contained' : 'outlined'}
            >
              THIS WEEK
            </Button>
            <Button
              onClick={() => handleDateRangePreset('thisMonth')}
              variant={dateRangePreset === 'thisMonth' ? 'contained' : 'outlined'}
            >
              THIS MONTH
            </Button>
          </ButtonGroup>

          <TextField
            type="date"
            size="small"
            value={queryRange.startDate}
            onChange={(e) => {
              setDateRangePreset('custom');
              setQueryRange({ ...queryRange, startDate: e.target.value });
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: queryRange.endDate || today }}
            sx={{ width: 150 }}
          />

          <TextField
            type="date"
            size="small"
            value={queryRange.endDate}
            onChange={(e) => {
              setDateRangePreset('custom');
              setQueryRange({ ...queryRange, endDate: e.target.value });
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: queryRange.startDate, max: today }}
            sx={{ width: 150 }}
          />

          <Button 
            variant="contained" 
            onClick={handleQuery}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            disabled={loading}
            size="small"
          >
            SEARCH
          </Button>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              to="/schedule-appointment"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              New Appointment
            </Button>

            <Button
              component={Link}
              to="/calendar"
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Calendar
            </Button>

            <Tooltip title="Refresh">
              <IconButton 
                color="primary" 
                onClick={fetchAppointments} 
                disabled={loading}
                size="small"
                sx={{ bgcolor: 'rgba(25, 118, 210, 0.04)' }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Location Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Location</InputLabel>
          <Select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            label="Location"
            startAdornment={<FilterListIcon sx={{ color: 'action.active', mr: 1 }} />}
          >
            <MenuItem value="all">All Locations</MenuItem>
            {locations.filter(loc => loc !== 'all').map(loc => (
              <MenuItem key={loc} value={loc}>
                {loc.toLowerCase().startsWith('http') ? 'Web' :
                 loc.charAt(0).toUpperCase() + loc.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 2
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Scheduled By</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={32} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                    No appointments found for the selected criteria
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              appointments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((appt) => (
                  <TableRow key={appt._id} hover>
                    <TableCell>{getAppointmentStatus(appt.date)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {appt.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {new Date(appt.date).toLocaleDateString()}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(appt.date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{appt.location}</TableCell>
                    <TableCell>{users.find((u) => u._id === appt.scheduledBy)?.firstName || "Unknown"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View/Edit Appointment">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/appointment/${appt._id}`)}
                          startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                          sx={{ 
                            mr: 1,
                            textTransform: 'none',
                            fontSize: '0.8125rem',
                          }}
                        >
                          VIEW/EDIT
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete Appointment">
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(appt._id)}
                          startIcon={<DeleteOutlineIcon sx={{ fontSize: 18 }} />}
                          sx={{ 
                            textTransform: 'none',
                            fontSize: '0.8125rem',
                          }}
                        >
                          DELETE
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={appointments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default AppointmentsDashboard; 