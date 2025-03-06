import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Link } from "react-router-dom";
import {
  Button,
  Typography,
  Container,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert
} from "@mui/material";
import { 
  FaClipboardList, 
  FaPlusCircle,
  FaCog,
  FaBell 
} from "react-icons/fa";
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const localizer = momentLocalizer(moment);

// Event types and their colors
const EVENT_TYPES = {
  client: { label: 'Client Meeting', color: '#007bff' },
  internal: { label: 'Internal Meeting', color: '#28a745' },
  urgent: { label: 'Urgent', color: '#dc3545' },
  followup: { label: 'Follow-up', color: '#ffc107' },
  default: { label: 'Other', color: '#6c757d' }
};

const Calendar = () => {
  // State Management
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });
  const [settings, setSettings] = useState({
    showWeekends: true,
    workHoursOnly: false,
    timeSlotDuration: 60,
    enableReminders: true
  });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchAppointments();
    // Set up event reminders
    if (settings.enableReminders) {
      const interval = setInterval(checkUpcomingEvents, 60000);
      return () => clearInterval(interval);
    }
  }, [settings.enableReminders]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in.");
        return;
      }

      const startDate = "2000-01-01T00:00:00.000Z";
      const endDate = "2100-01-01T00:00:00.000Z";
      const requestUrl = `${API_BASE_URL}/appointments?startDate=${startDate}&endDate=${endDate}`;

      const response = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!Array.isArray(response.data)) {
        setError("Unexpected API response format.");
        return;
      }

      const activeAppointments = response.data
        .filter(appt => !appt.toBeDeleted)
        .map(appt => ({
          id: appt._id,
          title: appt.title,
          start: new Date(appt.date),
          end: new Date(new Date(appt.date).getTime() + 60 * 60 * 1000),
          resource: {
            type: appt.type || 'default',
            location: appt.location || "N/A",
            scheduledBy: appt.scheduledBy || "N/A",
            contactName: appt.contactName || "N/A",
            contactPhone: appt.contactPhone || "N/A",
            contactEmail: appt.contactEmail || "N/A",
            description: appt.notes || "N/A",
          },
        }));

      setEvents(activeAppointments);
      setNotification({
        open: true,
        message: 'Calendar updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error("❌ Error fetching appointments:", error);
      setError(error.response?.data || error.message);
      setNotification({
        open: true,
        message: 'Error updating calendar',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUpcomingEvents = () => {
    if (!settings.enableReminders) return;
    
    const now = new Date();
    const upcoming = events.filter(event => {
      const start = new Date(event.start);
      const diff = start - now;
      return diff > 0 && diff <= 15 * 60 * 1000; // 15 minutes
    });

    upcoming.forEach(event => {
      setNotification({
        open: true,
        message: `Upcoming: ${event.title} in ${Math.round((new Date(event.start) - now) / 60000)} minutes`,
        severity: 'info'
      });
    });
  };

  const eventStyleGetter = (event) => {
    const eventType = event.resource.type || 'default';
    return {
      style: {
        backgroundColor: EVENT_TYPES[eventType].color,
        borderRadius: '4px',
        opacity: 0.85,
        color: 'white',
        border: '0px'
      }
    };
  };

  const filteredEvents = events.filter(event => {
    if (filters.type !== 'all' && event.resource.type !== filters.type) return false;
    if (!settings.showWeekends && [0, 6].includes(event.start.getDay())) return false;
    if (settings.workHoursOnly) {
      const hour = event.start.getHours();
      if (hour < 9 || hour >= 17) return false;
    }
    return true;
  });

  return (
    <Container maxWidth="lg" className="calendar-container">
      <Typography variant="h4" sx={{ textAlign: "center", mt: 3, mb: 4 }}>
        Success Calendar
      </Typography>

      {/* App Navigation */}
      <nav className="app-navigation" aria-label="Main Navigation">
        <ul>
          <li>
            <Link to="/appointments">
              <FaClipboardList className="icon" /> Appointments Dashboard
            </Link>
          </li>
          <li>
            <Link to="/schedule-appointment">
              <FaPlusCircle className="icon" /> Schedule Appointment
            </Link>
          </li>
        </ul>
      </nav>

      {/* Calendar Controls */}
      <Box className="calendar-controls">
        <Box className="calendar-controls-left">
          <Button 
            variant="outlined" 
            onClick={() => setDate(new Date())}
            size="small"
          >
            Today
          </Button>
          <IconButton onClick={() => {
            const newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            setDate(newDate);
          }}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={() => {
            const newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() + 1);
            setDate(newDate);
          }}>
            <ChevronRightIcon />
          </IconButton>
          <Typography variant="h6" className="current-date">
            {moment(date).format('MMMM YYYY')}
          </Typography>
        </Box>

        <Box className="calendar-controls-right">
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              label="Event Type"
            >
              <MenuItem value="all">All Events</MenuItem>
              {Object.entries(EVENT_TYPES).map(([key, value]) => (
                <MenuItem key={key} value={key}>{value.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={calendarView}
            exclusive
            onChange={(e, newView) => newView && setCalendarView(newView)}
            size="small"
          >
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="agenda">Agenda</ToggleButton>
          </ToggleButtonGroup>

          <IconButton onClick={() => setSettingsOpen(true)} className="settings-button">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Calendar View */}
      <div className="calendar-view">
        {isLoading && (
          <Box className="loading-overlay">
            <CircularProgress />
          </Box>
        )}
        
        <BigCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setEventDialogOpen(true);
          }}
          view={calendarView}
          onView={setCalendarView}
          date={date}
          onNavigate={setDate}
          popup={true}
          min={settings.workHoursOnly ? new Date(0, 0, 0, 9, 0, 0) : undefined}
          max={settings.workHoursOnly ? new Date(0, 0, 0, 17, 0, 0) : undefined}
        />
      </div>

      {/* Event Details Dialog */}
      <Dialog 
        open={eventDialogOpen} 
        onClose={() => setEventDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="event-dialog"
      >
        <DialogTitle>
          {selectedEvent?.title}
          <Typography variant="subtitle2" color="text.secondary">
            {EVENT_TYPES[selectedEvent?.resource.type || 'default'].label}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Time</Typography>
            <Typography gutterBottom>
              {selectedEvent?.start.toLocaleString()} - {selectedEvent?.end.toLocaleString()}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">Location</Typography>
            <Typography gutterBottom>{selectedEvent?.resource.location}</Typography>

            <Typography variant="subtitle2" color="text.secondary">Contact Information</Typography>
            <Typography>Name: {selectedEvent?.resource.contactName}</Typography>
            <Typography>Phone: {selectedEvent?.resource.contactPhone}</Typography>
            <Typography>Email: {selectedEvent?.resource.contactEmail}</Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Notes</Typography>
            <Typography>{selectedEvent?.resource.description}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            component={Link} 
            to={`/appointments/edit/${selectedEvent?.id}`}
          >
            Edit Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        className="settings-dialog"
      >
        <DialogTitle>Calendar Settings</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={settings.showWeekends}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  showWeekends: e.target.checked
                }))}
              />
            }
            label="Show Weekends"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.workHoursOnly}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  workHoursOnly: e.target.checked
                }))}
              />
            }
            label="Show Work Hours Only (9 AM - 5 PM)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.enableReminders}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  enableReminders: e.target.checked
                }))}
              />
            }
            label="Enable Event Reminders"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Calendar;