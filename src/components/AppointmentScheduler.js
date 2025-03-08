import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button, CircularProgress, IconButton } from "@mui/material";
import { 
  Event as EventIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Notes as NotesIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import DatePicker from "react-datepicker";
import Select from "react-select";
import MiniCalendar from "react-calendar";
import { toast, ToastContainer } from "react-toastify";
import { api, handleHttpError } from '../utils';
import { NotificationService, AnalyticsService, ErrorLogger } from '../services';
import "react-calendar/dist/Calendar.css";
import "react-toastify/dist/ReactToastify.css";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentScheduler.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app";

const schema = yup.object().shape({
  title: yup.string()
    .required("Title is required")
    .min(3, "Title must be at least 3 characters"),
  date: yup.date()
    .required("Date is required")
    .min(new Date(), "Date cannot be in the past"),
  location: yup.string()
    .required("Location is required")
    .min(3, "Location must be at least 3 characters"),
  contactName: yup.string()
    .required("Contact name is required")
    .min(2, "Contact name must be at least 2 characters"),
  contactPhone: yup.string()
    .required("Contact phone is required")
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, "Invalid phone number format"),
  contactEmail: yup.string()
    .email("Invalid email format")
    .required("Contact email is required"),
  scheduledBy: yup.object().shape({
    value: yup.string().required("Scheduled by is required"),
    label: yup.string().required()
  }).required("Scheduled by is required"),
  notes: yup.string().notRequired(),
  isRecurring: yup.boolean().default(false),
  recurringFrequency: yup.string()
    .nullable()
    .when('isRecurring', {
      is: true,
      then: (schema) => schema
        .required('Recurring frequency is required')
        .oneOf(['daily', 'weekly', 'monthly'], 'Invalid frequency')
    }),
  recurringEndDate: yup.date()
    .nullable()
    .when('isRecurring', {
      is: true,
      then: (schema) => schema
        .required('End date is required for recurring appointments')
        .min(yup.ref('date'), 'End date must be after start date')
    })
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AppointmentScheduler = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [quickNotes, setQuickNotes] = useState(localStorage.getItem("quickNotes") || "");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'analytics'
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Move users query to the top and ensure it's initialized before use
  const { data: usersData = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to access the appointment scheduler");
        navigate('/login');
        return [];
      }
      try {
        const response = await api.get('/users');
        
        // If response is already an array, use it directly
        if (Array.isArray(response)) {
          return response.map(user => ({
            value: user._id?.toString().replace(/"/g, ''),
            label: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user.email || 'Unknown User'
          }));
        }

        // Handle response.data
        let usersData = response?.data;
        if (!Array.isArray(usersData)) {
          usersData = usersData?.users || usersData?.data || [];
        }

        return usersData.map(user => ({
          value: user._id?.toString().replace(/"/g, ''),
          label: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email || 'Unknown User'
        }));
      } catch (error) {
        ErrorLogger.logToFile(error, 'AppointmentScheduler:fetchUsers');
        return [];
      }
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate('/login');
      } else {
        toast.error(`Failed to fetch users: ${error.message}`);
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      isRecurring: false,
      recurringFrequency: "weekly"
    }
  });

  // Watch for recurring checkbox changes
  const watchIsRecurring = watch("isRecurring");
  useEffect(() => {
    setIsRecurring(watchIsRecurring);
  }, [watchIsRecurring]);

  // Token validation effect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to access the appointment scheduler");
      navigate('/login');
    }
  }, [navigate]);

  // Handle edit appointment data effect - now depends on usersData being loaded
  useEffect(() => {
    const editAppointmentData = localStorage.getItem('editAppointment');
    if (!editAppointmentData || !usersData || usersData.length === 0) return;

    try {
      const appointmentData = JSON.parse(editAppointmentData);
      setIsEditMode(true);
      
      // Find the matching user from the usersData array
      const scheduledByUser = usersData.find(user => 
        user.value === (appointmentData.scheduledBy?.value || appointmentData.scheduledBy)
      );

      if (scheduledByUser) {
        reset({
          ...appointmentData,
          date: new Date(appointmentData.date),
          scheduledBy: scheduledByUser
        });
      }
      localStorage.removeItem('editAppointment');
    } catch (error) {
      console.error('Error parsing edit appointment data:', error);
      ErrorLogger.logToFile(error, 'AppointmentScheduler:parseEditData');
      toast.error('Failed to load appointment data for editing');
    }
  }, [usersData, reset]);

  // Add useEffect to fetch appointments on mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch appointments query
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to access the appointment scheduler");
        navigate('/login');
        return;
      }

      const startDate = new Date().toISOString();
      const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();

      const response = await api.get("/appointments", {
        params: { startDate, endDate }
      });

      // Handle different response formats
      let appointmentsData = Array.isArray(response) ? response : response?.data;
      if (!Array.isArray(appointmentsData)) {
        appointmentsData = appointmentsData?.appointments || appointmentsData?.data || [];
      }

      setAppointments(appointmentsData);
      
      // Calculate metrics from appointments data
      const now = new Date();
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      
      const monthlyAppointments = appointmentsData.filter(apt => 
        new Date(apt.date) >= monthAgo && new Date(apt.date) <= new Date()
      );

      // Calculate trends
      const trends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(monthAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const count = monthlyAppointments.filter(apt => 
          apt.date.split('T')[0] === dateStr
        ).length;
        return { date: dateStr, appointments: count };
      });

      // Calculate other metrics
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointmentsData.filter(apt => 
        apt.date.split('T')[0] === today
      );

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAppointments = appointmentsData.filter(apt => 
        new Date(apt.date) >= weekAgo
      );

      // Group by location
      const locationMap = appointmentsData.reduce((acc, apt) => {
        acc[apt.location] = (acc[apt.location] || 0) + 1;
        return acc;
      }, {});

      const locations = Object.entries(locationMap).map(([name, count]) => ({
        name,
        appointments: count
      }));

      setMetrics({
        trends,
        statistics: {
          today: {
            total: todayAppointments.length,
            completed: todayAppointments.filter(apt => new Date(apt.date) < new Date()).length
          },
          week: {
            total: weekAppointments.length,
            average: Math.round(weekAppointments.length / 7)
          },
          statusDistribution: {
            completed: appointmentsData.filter(apt => new Date(apt.date) < new Date()).length,
            pending: appointmentsData.filter(apt => new Date(apt.date) >= new Date()).length,
            cancelled: appointmentsData.filter(apt => apt.toBeDeleted).length,
            rescheduled: 0
          }
        },
        revenue: {
          monthly: 0,
          growth: 0
        },
        locations
      });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate('/login');
      } else {
        handleHttpError(error, 'AppointmentScheduler');
        ErrorLogger.logToFile(error, 'AppointmentScheduler:fetchAppointments');
        setAppointments([]); // Set empty array on error
      }
    } finally {
      setLoading(false);
    }
  };

  // Schedule appointment mutation
  const scheduleAppointment = useMutation({
    mutationFn: async (appointmentData) => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to access the appointment scheduler");
        navigate('/login');
        return;
      }

      // Base appointment data
      const baseAppointment = {
        title: appointmentData.title,
        location: appointmentData.location,
        contactName: appointmentData.contactName,
        contactPhone: appointmentData.contactPhone,
        contactEmail: appointmentData.contactEmail,
        scheduledBy: appointmentData.scheduledBy.value.replace(/"/g, ''),
        notes: appointmentData.notes || '',
        toBeDeleted: false,
        isRecurring: appointmentData.isRecurring || false,
        recurringFrequency: appointmentData.recurringFrequency,
        recurringEndDate: appointmentData.recurringEndDate
      };

      try {
        if (appointmentData.isRecurring) {
          // Calculate all dates in the recurring series
          const startDate = new Date(appointmentData.date);
          const endDate = new Date(appointmentData.recurringEndDate);
          const frequency = appointmentData.recurringFrequency;
          const dates = [];

          // Get the time components from the start date
          const hours = startDate.getHours();
          const minutes = startDate.getMinutes();

          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            // Create a new date instance to avoid modifying the same object
            const appointmentDate = new Date(currentDate);
            // Set the original appointment time
            appointmentDate.setHours(hours);
            appointmentDate.setMinutes(minutes);
            dates.push(appointmentDate);
            
            // Create a new date for the next iteration to avoid modifying the existing dates
            const nextDate = new Date(currentDate);
            switch (frequency) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            }
            currentDate = nextDate;
          }

          // Create all appointments in the series
          const appointments = await Promise.all(
            dates.map(async (date) => {
              const appointmentWithDate = {
                ...baseAppointment,
                date: date.toISOString()
              };
              const response = await api.post("/appointments", appointmentWithDate);
              return response.data;
            })
          );

          // Send notifications for the first appointment only
          try {
            await NotificationService.sendEmailNotification(appointments[0]);
            await NotificationService.sendSMSNotification(appointments[0]);
          } catch (error) {
            console.error('Failed to send notifications:', error);
          }

          return appointments;
        } else {
          // Single appointment
          const singleAppointment = {
            ...baseAppointment,
            date: appointmentData.date
          };

          const response = await api.post("/appointments", singleAppointment);
          
          try {
            await NotificationService.sendEmailNotification(response.data);
            await NotificationService.sendSMSNotification(response.data);
          } catch (error) {
            console.error('Failed to send notifications:', error);
          }

          return response.data;
        }
      } catch (error) {
        console.error('Failed to schedule appointment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? "✅ Appointment updated successfully!" : "✅ Appointment(s) scheduled successfully!");
      setIsEditMode(false);
      reset({
        title: '',
        date: null,
        location: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        scheduledBy: null,
        notes: '',
        isRecurring: false,
        recurringFrequency: 'weekly',
        recurringEndDate: null
      });
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["analytics"]);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate('/login');
      } else {
        toast.error(`❌ Error: ${error.response?.data?.message || "Failed to schedule appointment"}`);
      }
    },
  });

  // Delete appointment mutation
  const deleteAppointment = useMutation({
    mutationFn: async (appointmentId) => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to access the appointment scheduler");
        navigate('/login');
        return;
      }

      // Instead of hard deleting, mark as toBeDeleted
      await api.patch(`/appointments/${appointmentId}`, {
        toBeDeleted: true
      });

      // Cancel notifications
      await NotificationService.cancelNotifications(appointmentId);
    },
    onSuccess: () => {
      toast.success("Appointment deleted successfully!");
      setSelectedAppointment(null);
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["analytics"]);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate('/login');
      } else {
        toast.error(`Failed to delete appointment: ${error.message}`);
      }
    },
  });

  // Enable analytics query with proper data transformation
  const { data: analyticsData = {}, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Get appointments for analytics
      const now = new Date();
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      
      const response = await api.get("/appointments", {
        params: {
          startDate: monthAgo.toISOString(),
          endDate: new Date().toISOString()
        }
      });

      let appointmentsData = Array.isArray(response) ? response : response?.data;
      if (!Array.isArray(appointmentsData)) {
        appointmentsData = appointmentsData?.appointments || appointmentsData?.data || [];
      }

      // Calculate trends (appointments per day)
      const trends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(monthAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const count = appointmentsData.filter(apt => 
          apt.date.split('T')[0] === dateStr
        ).length;
        return { date: dateStr, appointments: count };
      });

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointmentsData.filter(apt => 
        apt.date.split('T')[0] === today
      );

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAppointments = appointmentsData.filter(apt => 
        new Date(apt.date) >= weekAgo
      );

      // Group appointments by location
      const locationMap = appointmentsData.reduce((acc, apt) => {
        acc[apt.location] = (acc[apt.location] || 0) + 1;
        return acc;
      }, {});

      const locations = Object.entries(locationMap).map(([name, appointments]) => ({
        name,
        appointments
      }));

      return {
        trends,
        statistics: {
          today: {
            total: todayAppointments.length,
            completed: todayAppointments.filter(apt => new Date(apt.date) < new Date()).length
          },
          week: {
            total: weekAppointments.length,
            average: Math.round(weekAppointments.length / 7)
          },
          statusDistribution: {
            completed: appointmentsData.filter(apt => new Date(apt.date) < new Date()).length,
            pending: appointmentsData.filter(apt => new Date(apt.date) >= new Date()).length,
            cancelled: appointmentsData.filter(apt => apt.toBeDeleted).length,
            rescheduled: 0 // Add logic for rescheduled if available
          }
        },
        revenue: {
          monthly: 0, // Add revenue calculation if available
          growth: 0 // Add growth calculation if available
        },
        locations
      };
    },
    enabled: true, // Enable the query
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
  });

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      await deleteAppointment.mutateAsync(appointmentId);
    }
  };

  const handleEditAppointment = (appointment) => {
    setIsEditMode(true);
    reset({
      ...appointment,
      date: new Date(appointment.date),
      scheduledBy: {
        label: `${appointment.scheduledBy.firstName} ${appointment.scheduledBy.lastName}`,
        value: appointment.scheduledBy._id,
      },
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    reset({
      title: '',
      date: null,
      location: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      scheduledBy: null,
      notes: '',
      isRecurring: false,
      recurringFrequency: 'weekly',
      recurringEndDate: null
    });
  };

  // Business Metrics Component
  const BusinessMetrics = () => {
    if (isLoadingAnalytics) {
      return (
        <div className="loading-state">
          <CircularProgress size={24} />
          <p>Loading analytics...</p>
        </div>
      );
    }

    const {
      trends = [],
      statistics = {},
      revenue = {},
      locations = []
    } = analyticsData;

    return (
      <div className="business-metrics">
        <div className="metrics-header">
          <h3 className="metrics-title">
            <AssessmentIcon /> Business Insights
          </h3>
          <div className="view-toggle">
            <Button
              size="small"
              variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
              onClick={() => navigate('/calendar')}
              startIcon={<CalendarIcon />}
              component={Link}
              to="/calendar"
            >
              Calendar
            </Button>
            <Button
              size="small"
              variant={viewMode === 'analytics' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('analytics')}
              startIcon={<AssessmentIcon />}
            >
              Analytics
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EventIcon />}
              component={Link}
              to="/appointments"
            >
              Appointments
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PersonIcon />}
              component={Link}
              to="/crm"
            >
              Clients
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<NotesIcon />}
              component={Link}
              to="/notes"
            >
              Notes
            </Button>
          </div>
        </div>

        {viewMode === 'analytics' ? (
          <>
            {/* Appointment Trends Chart */}
            <div className="metric chart">
              <h4>
                <ScheduleIcon /> Appointment Trends
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#0056b3"
                    name="Appointments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Statistics Summary */}
            <div className="metrics-grid">
              <div className="metric stat-card">
                <h4>Today's Stats</h4>
                <div className="stat-content">
                  <div className="stat-value">{statistics.today?.total || 0}</div>
                  <div className="stat-label">Total Appointments</div>
                  <div className="stat-secondary">
                    <span>{statistics.today?.completed || 0} completed</span>
                  </div>
                </div>
              </div>

              <div className="metric stat-card">
                <h4>This Week</h4>
                <div className="stat-content">
                  <div className="stat-value">{statistics.week?.total || 0}</div>
                  <div className="stat-label">Total Appointments</div>
                  <div className="stat-secondary">
                    <span>Avg {statistics.week?.average || 0}/day</span>
                  </div>
                </div>
              </div>

              <div className="metric stat-card">
                <h4>Revenue</h4>
                <div className="stat-content">
                  <div className="stat-value">${revenue.monthly || 0}</div>
                  <div className="stat-label">Monthly Revenue</div>
                  <div className="stat-secondary">
                    <span>{revenue.growth > 0 ? '+' : ''}{revenue.growth || 0}% growth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="metric chart">
              <h4>Status Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: statistics.statusDistribution?.completed || 0 },
                      { name: 'Pending', value: statistics.statusDistribution?.pending || 0 },
                      { name: 'Cancelled', value: statistics.statusDistribution?.cancelled || 0 },
                      { name: 'Rescheduled', value: statistics.statusDistribution?.rescheduled || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statistics.statusDistribution &&
                      Object.entries(statistics.statusDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Location Performance */}
            <div className="metric chart">
              <h4>
                <LocationIcon /> Location Performance
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={locations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="appointments"
                    fill="#0056b3"
                    name="Appointments"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Export Report Button */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<AssessmentIcon />}
              onClick={handleExportReport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  <span>Exporting...</span>
                </>
              ) : (
                "Export Monthly Report"
              )}
            </Button>
          </>
        ) : (
          <>
            <h4>
              <CalendarIcon /> Quick Calendar
            </h4>
            <MiniCalendar
              onChange={setSelectedDate}
              value={selectedDate}
              className="mini-calendar"
              tileContent={({ date }) => {
                const appointmentsOnDate = appointments.filter(
                  appt => new Date(appt.date).toDateString() === date.toDateString()
                );
                return appointmentsOnDate.length > 0 ? (
                  <div className="appointment-indicator">{appointmentsOnDate.length}</div>
                ) : null;
              }}
            />

            <div className="quick-notes-section">
              <h4>
                <NotesIcon /> Quick Notes
              </h4>
              <textarea
                className="quick-notes"
                value={quickNotes}
                onChange={(e) => {
                  setQuickNotes(e.target.value);
                  localStorage.setItem("quickNotes", e.target.value);
                }}
                placeholder="Write quick notes here..."
              />
            </div>
          </>
        )}
      </div>
    );
  };

  // Add export handler function
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      await AnalyticsService.exportAnalyticsReport('monthly', {
        startDate: monthAgo,
        endDate: new Date()
      });
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report. Please try again.");
      ErrorLogger.logToFile(error, 'AppointmentScheduler:exportReport');
    } finally {
      setIsExporting(false);
    }
  };

  // Add modal handlers
  const handleOpenModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
    setIsModalOpen(false);
  };

  // Update the upcoming appointments section in the render
  const renderUpcomingAppointments = () => {
    if (!Array.isArray(appointments)) {
      return (
        <div className="upcoming-appointments">
          <div className="section-header">
            <h4>
              <ScheduleIcon fontSize="small" /> Upcoming Appointments
            </h4>
          </div>
          <div className="loading-state">
            <p>Loading appointments...</p>
          </div>
        </div>
      );
    }

    const sortedAppointments = [...appointments]
      .filter(apt => !apt.toBeDeleted)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter(apt => new Date(apt.date) >= new Date())
      .slice(0, 5);

    return (
      <div className="upcoming-appointments">
        <div className="section-header">
          <h4>
            <ScheduleIcon fontSize="small" /> Upcoming Appointments
          </h4>
        </div>
        {loading ? (
          <div className="loading-state">
            <CircularProgress size={20} />
            <p>Loading appointments...</p>
          </div>
        ) : sortedAppointments.length > 0 ? (
          <ul className="appointments-list">
            {sortedAppointments.map((appointment) => (
              <li key={appointment._id} onClick={() => handleOpenModal(appointment)}>
                <div className="appointment-info">
                  <div className="appointment-primary">
                    <span className="appointment-title">
                      {appointment.title}
                    </span>
                    <div className="appointment-meta">
                      <LocationIcon fontSize="small" />
                      <span className="location-text">{appointment.location}</span>
                    </div>
                  </div>
                  <div className="appointment-secondary">
                    <span className="appointment-date">
                      {new Date(appointment.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="appointment-time">
                      {new Date(appointment.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="appointment-actions">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAppointment(appointment);
                    }}
                    className="edit-button"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAppointment(appointment._id);
                    }}
                    className="delete-button"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-appointments">
            <p>No upcoming appointments scheduled</p>
          </div>
        )}
      </div>
    );
  };

  // Add modal component
  const AppointmentModal = () => {
    if (!selectedAppointment || !isModalOpen) return null;

    return (
      <div className="modal-overlay" onClick={handleCloseModal}>
        <div className="appointment-details-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{selectedAppointment.title}</h2>
            <button className="modal-close-button" onClick={handleCloseModal}>
              <CloseIcon />
            </button>
          </div>
          <div className="modal-content">
            <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(selectedAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Location:</strong> {selectedAppointment.location}</p>
            <p><strong>Contact:</strong> {selectedAppointment.contactName}</p>
            <p><strong>Phone:</strong> {selectedAppointment.contactPhone}</p>
            <p><strong>Email:</strong> {selectedAppointment.contactEmail}</p>
            {selectedAppointment.notes && (
              <p><strong>Notes:</strong> {selectedAppointment.notes}</p>
            )}
            <div className="modal-actions">
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleEditAppointment(selectedAppointment);
                  handleCloseModal();
                }}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  handleDeleteAppointment(selectedAppointment._id);
                  handleCloseModal();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scheduler-wrapper">
      {/* Left Sidebar */}
      <aside className="sidebar left-sidebar">
        <BusinessMetrics />
      </aside>

      {/* Main Form */}
      <div className="scheduler-container">
        <h1 className="scheduler-title">
          <EventIcon /> Business Appointment Scheduler
        </h1>

        <form className="scheduler-form" onSubmit={handleSubmit(scheduleAppointment.mutate)}>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <EventIcon /> Title
              </label>
              <input 
                {...register("title")} 
                type="text" 
                placeholder="Enter appointment title"
                className={errors.title ? "error" : ""}
              />
              {errors.title && <span className="error-message">{errors.title.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <EventIcon /> Date & Time
              </label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    showTimeSelect
                    dateFormat="Pp"
                    placeholderText="Select date and time"
                    className={errors.date ? "error" : ""}
                    minDate={new Date()}
                  />
                )}
              />
              {errors.date && <span className="error-message">{errors.date.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <LocationIcon /> Location
              </label>
              <input 
                {...register("location")} 
                type="text" 
                placeholder="Enter location"
                className={errors.location ? "error" : ""}
              />
              {errors.location && <span className="error-message">{errors.location.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <PersonIcon /> Scheduled By
              </label>
              <Controller
                control={control}
                name="scheduledBy"
                render={({ field }) => (
                  <Select
                    {...field}
                    options={usersData}
                    isLoading={usersLoading}
                    placeholder={usersLoading ? "Loading users..." : "Select user"}
                    className={errors.scheduledBy ? "error" : ""}
                    onChange={(selectedOption) => {
                      if (!selectedOption) {
                        setValue("scheduledBy", null);
                        return;
                      }
                      const cleanOption = {
                        ...selectedOption,
                        value: selectedOption.value?.toString().replace(/"/g, '')
                      };
                      setValue("scheduledBy", cleanOption);
                    }}
                    value={getValues("scheduledBy") || null}
                    isDisabled={usersLoading}
                    noOptionsMessage={() => "No users available"}
                    loadingMessage={() => "Loading users..."}
                  />
                )}
              />
              {errors.scheduledBy && <span className="error-message">{errors.scheduledBy.message}</span>}
              {usersData.length === 0 && !usersLoading && (
                <span className="error-message">No users available. Please check your connection.</span>
              )}
            </div>

            <div className="form-group">
              <label>
                <PersonIcon /> Contact Name
              </label>
              <input 
                {...register("contactName")} 
                type="text" 
                placeholder="Enter contact name"
                className={errors.contactName ? "error" : ""}
              />
              {errors.contactName && <span className="error-message">{errors.contactName.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <PhoneIcon /> Contact Phone
              </label>
              <input 
                {...register("contactPhone")} 
                type="tel" 
                placeholder="Enter phone number"
                className={errors.contactPhone ? "error" : ""}
              />
              {errors.contactPhone && <span className="error-message">{errors.contactPhone.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <EmailIcon /> Contact Email
              </label>
              <input 
                {...register("contactEmail")} 
                type="email" 
                placeholder="Enter email address"
                className={errors.contactEmail ? "error" : ""}
              />
              {errors.contactEmail && <span className="error-message">{errors.contactEmail.message}</span>}
            </div>

            <div className="form-group recurring-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  {...register("isRecurring")} 
                /> Recurring Appointment
              </label>

              {isRecurring && (
                <>
                  <div className="recurring-details">
                    <select {...register("recurringFrequency")}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    
                    <Controller
                      control={control}
                      name="recurringEndDate"
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          placeholderText="Select end date"
                          className={errors.recurringEndDate ? "error" : ""}
                          minDate={getValues("date")}
                        />
                      )}
                    />
                  </div>
                  {errors.recurringEndDate && (
                    <span className="error-message">{errors.recurringEndDate.message}</span>
                  )}
                </>
              )}
            </div>

            <div className="form-group full-width">
              <label>
                <NotesIcon /> Notes
              </label>
              <textarea 
                {...register("notes")} 
                placeholder="Enter any additional notes"
                className={errors.notes ? "error" : ""}
              />
              {errors.notes && <span className="error-message">{errors.notes.message}</span>}
            </div>
          </div>

          <div className="button-container">
            {isEditMode && (
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancelEdit}
              >
                <CloseIcon />
                <span>Cancel Edit</span>
              </button>
            )}
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <EventIcon />
                  <span>{isEditMode ? "Update Appointment" : "Schedule Appointment"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Sidebar */}
      <aside className="sidebar right-sidebar">
        {renderUpcomingAppointments()}
      </aside>

      <AppointmentModal />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AppointmentScheduler; 