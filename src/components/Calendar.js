import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, IconButton,
  CircularProgress, Paper, Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Event as EventIcon,
  Today as TodayIcon,
  CalendarViewDay as ViewDayIcon,
  CalendarViewWeek as ViewWeekIcon,
  CalendarViewMonth as ViewMonthIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  LocationOn as LocationOnIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Notes as NotesIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../utils';
import { ErrorLogger } from '../services';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Line, Tooltip as RechartsTooltip } from 'recharts';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

const EVENT_TYPES = {
  default: { label: 'Standard', color: '#3174ad' },
  urgent: { label: 'Urgent', color: '#d32f2f' },
  followup: { label: 'Follow-up', color: '#388e3c' },
  consultation: { label: 'Consultation', color: '#7b1fa2' },
  routine: { label: 'Routine', color: '#0288d1' }
};

const Calendar = () => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch appointments query
  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view appointments');
        return [];
      }

      try {
        setLoading(true);
        const startDate = new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString();
        const endDate = new Date(date.getFullYear(), date.getMonth() + 2, 0).toISOString();

        const response = await api.get('/appointments', {
          params: { startDate, endDate }
        });

        let appointmentsData = Array.isArray(response) ? response : response?.data;
        if (!Array.isArray(appointmentsData)) {
          appointmentsData = appointmentsData?.appointments || appointmentsData?.data || [];
        }

        // Transform appointments for calendar display
        return appointmentsData
          .filter(apt => !apt.toBeDeleted)
          .map(apt => ({
            id: apt._id,
            title: apt.title,
            start: new Date(apt.date),
            end: new Date(new Date(apt.date).getTime() + 60 * 60 * 1000), // 1 hour duration
            resource: {
              type: apt.type || 'default',
              location: apt.location,
              contactName: apt.contactName,
              contactPhone: apt.contactPhone,
              contactEmail: apt.contactEmail,
              description: apt.notes
            }
          }));
      } catch (error) {
        ErrorLogger.logToFile(error, 'Calendar:fetchAppointments');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000 // Consider data stale after 4 minutes
  });

  useEffect(() => {
    if (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(`Failed to fetch appointments: ${error.message}`);
      }
    }
  }, [error]);

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: EVENT_TYPES[event.resource.type || 'default'].color,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      display: 'block',
      textShadow: '0px 1px 2px rgba(0, 0, 0, 0.4)'
    };
    return { style };
  };

  const CustomToolbar = ({ onNavigate, onView, label }) => (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <Button
          onClick={() => onNavigate('TODAY')}
          startIcon={<TodayIcon />}
          variant="outlined"
          size="small"
        >
          Today
        </Button>
        <div className="navigation-buttons">
          <IconButton onClick={() => onNavigate('PREV')}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" component="span" className="toolbar-label">
            {label}
          </Typography>
          <IconButton onClick={() => onNavigate('NEXT')}>
            <ChevronRightIcon />
          </IconButton>
        </div>
      </div>
      <div className="toolbar-right">
        <div className="view-buttons">
          <Tooltip title="Day view">
            <IconButton 
              onClick={() => onView('day')}
              color={view === 'day' ? 'primary' : 'default'}
            >
              <ViewDayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Week view">
            <IconButton 
              onClick={() => onView('week')}
              color={view === 'week' ? 'primary' : 'default'}
            >
              <ViewWeekIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Month view">
            <IconButton 
              onClick={() => onView('month')}
              color={view === 'month' ? 'primary' : 'default'}
            >
              <ViewMonthIcon />
            </IconButton>
          </Tooltip>
        </div>
        <IconButton onClick={() => setSettingsDialogOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );

  return (
    <div className="calendar-page-layout">
      {/* Left Sidebar */}
      <aside className="calendar-sidebar left-sidebar">
        <Paper elevation={2} className="sidebar-widget">
          <Typography variant="h6" className="widget-title">
            <AssessmentIcon sx={{ mr: 1 }} /> Quick Stats
          </Typography>
          <div className="stats-grid">
            <div className="stat-item">
              <Typography variant="subtitle2" color="text.secondary">Today's Appointments</Typography>
              <Typography variant="h4">{appointments.filter(apt => 
                new Date(apt.start).toDateString() === new Date().toDateString()
              ).length}</Typography>
            </div>
            <div className="stat-item">
              <Typography variant="subtitle2" color="text.secondary">This Week</Typography>
              <Typography variant="h4">{appointments.filter(apt => {
                const aptDate = new Date(apt.start);
                const today = new Date();
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                return aptDate >= weekStart;
              }).length}</Typography>
            </div>
          </div>
        </Paper>

        <Paper elevation={2} className="sidebar-widget">
          <Typography variant="h6" className="widget-title">
            <EventIcon sx={{ mr: 1 }} /> Upcoming Appointments
          </Typography>
          <div className="upcoming-appointments">
            {[
              { label: 'Today', filter: date => date.toDateString() === new Date().toDateString() },
              { label: 'Tomorrow', filter: date => date.toDateString() === new Date(Date.now() + 86400000).toDateString() },
              { label: 'This Week', filter: date => {
                const today = new Date();
                const weekEnd = new Date(today.setDate(today.getDate() + (6 - today.getDay())));
                return date >= new Date() && date <= weekEnd;
              }},
              { label: 'Next Week', filter: date => {
                const today = new Date();
                const nextWeekStart = new Date(today.setDate(today.getDate() - today.getDay() + 7));
                const nextWeekEnd = new Date(today.setDate(today.getDate() + 6));
                return date >= nextWeekStart && date <= nextWeekEnd;
              }}
            ].map(({ label, filter }) => {
              const count = appointments.filter(apt => filter(new Date(apt.start))).length;
              return (
                <div key={label} className="upcoming-item">
                  <Typography variant="body2">{label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {count} {count === 1 ? 'appointment' : 'appointments'}
                  </Typography>
                </div>
              );
            })}
          </div>
        </Paper>
      </aside>

      {/* Main Calendar */}
      <Paper className="calendar-container" elevation={2}>
        <div className="calendar-header">
          <Typography variant="h4" component="h1" className="calendar-title" sx={{ textAlign: 'center', width: '100%' }}>
            <EventIcon sx={{ mr: 2 }} /> Success Calendar
          </Typography>
        </div>

        <div className="app-navigation">
          <Typography variant="h6" gutterBottom>Quick Access</Typography>
          <div className="app-links">
            <Button
              size="small"
              variant="text"
              startIcon={<DashboardIcon />}
              component={Link}
              to="/dashboard"
              sx={{ mx: 1 }}
            >
              Dashboard
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<EventIcon />}
              component={Link}
              to="/appointments"
              sx={{ mx: 1 }}
            >
              Appointments
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<PersonIcon />}
              component={Link}
              to="/crm"
              sx={{ mx: 1 }}
            >
              CRM
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<AssessmentIcon />}
              component={Link}
              to="/analytics"
              sx={{ mx: 1 }}
            >
              Analytics
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<EventIcon />}
              component={Link}
              to="/scheduler"
              sx={{ mx: 1 }}
            >
              Scheduler
            </Button>
          </div>
        </div>

        <div className="calendar-wrapper">
          {isLoading ? (
            <div className="loading-state">
              <CircularProgress />
              <Typography>Loading appointments...</Typography>
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={appointments}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100vh - 320px)' }}
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar
              }}
              popup
              tooltipAccessor={event => `${format(event.start, 'HH:mm')} - ${event.title} - ${event.resource.location}`}
            />
          )}
        </div>
      </Paper>

      {/* Right Sidebar */}
      <aside className="calendar-sidebar right-sidebar">
        <Paper elevation={2} className="sidebar-widget">
          <Typography variant="h6" className="widget-title">
            <LocationOnIcon sx={{ mr: 1 }} /> Top Locations
          </Typography>
          <div className="locations-list">
            {Object.entries(
              appointments.reduce((acc, apt) => {
                // Check if location is a URL and replace with "Web"
                const location = apt.resource.location?.startsWith('http') || 
                                apt.resource.location?.startsWith('@http') ? 
                                'Web' : apt.resource.location;
                acc[location] = (acc[location] || 0) + 1;
                return acc;
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([location, count]) => (
                <div key={location} className="location-item">
                  <Typography variant="body2">{location || 'No location'}</Typography>
                  <Typography variant="body2" color="text.secondary">{count} appointments</Typography>
                </div>
              ))}
          </div>
        </Paper>

        <Paper elevation={2} className="sidebar-widget">
          <Typography variant="h6" className="widget-title">
            <TrendingUpIcon sx={{ mr: 1 }} /> Monthly Trend
          </Typography>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={
                Object.entries(appointments
                  .reduce((acc, apt) => {
                    const date = new Date(apt.start).toLocaleDateString();
                    acc[date] = (acc[date] || 0) + 1;
                    return acc;
                  }, {}))
                  .slice(-30)
                  .map(([date, count]) => ({ 
                    date: date,
                    appointments: count 
                  }))
              }>
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="appointments" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Paper>
      </aside>

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
            onClick={() => {
              setEventDialogOpen(false);
              // Navigate to appointments page with the event data
              const appointmentData = {
                id: selectedEvent?.id,
                title: selectedEvent?.title,
                date: selectedEvent?.start,
                location: selectedEvent?.resource.location,
                contactName: selectedEvent?.resource.contactName,
                contactPhone: selectedEvent?.resource.contactPhone,
                contactEmail: selectedEvent?.resource.contactEmail,
                notes: selectedEvent?.resource.description,
                type: selectedEvent?.resource.type || 'default'
              };
              // Store the appointment data in localStorage for the appointments page
              localStorage.setItem('editAppointment', JSON.stringify(appointmentData));
              window.location.href = '/appointments';
            }}
          >
            Edit Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Calendar Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>Event Types</Typography>
            {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: color,
                    mr: 2
                  }}
                />
                <Typography>{label}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Calendar; 