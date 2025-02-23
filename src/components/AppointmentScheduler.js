import { useState } from "react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DatePicker from "react-datepicker";
import Select from "react-select";
import MiniCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast, ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentScheduler.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

// ✅ Form Validation Schema
const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  date: yup.date().required("Date is required"),
  location: yup.string().notRequired(),
  contactName: yup.string().notRequired(),
  contactPhone: yup.string().notRequired(),
  contactEmail: yup.string().email("Invalid email").notRequired(),
  scheduledBy: yup.string().required("User must be selected"),
  notes: yup.string().notRequired(),
});

const AppointmentScheduler = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [quickNotes, setQuickNotes] = useState(localStorage.getItem("quickNotes") || ""); 

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // ✅ Fetch Users with React Query
  const { data: users = [], isLoading } = useQuery({
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

  // ✅ Fetch Upcoming Appointments
  const { data: appointments = [], isLoading: isLoadingAppointments, error: appointmentsError } = useQuery({
    queryKey: ["upcomingAppointments"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        // Format startDate (current date) and endDate (next 30 days)
        const startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        const formattedEndDate = endDate.toISOString();

        console.log(`📅 Fetching upcoming appointments from ${startDate} to ${formattedEndDate}`);

        const response = await axios.get(
          `${API_BASE_URL}/appointments?startDate=${startDate}&endDate=${formattedEndDate}&limit=10`, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        return response.data;
      } catch (error) {
        console.error("❌ Error fetching upcoming appointments:", error.response?.data || error.message);
        throw error;
      }
    },
  });

  // ✅ Mutation for Scheduling an Appointment
  const scheduleAppointment = useMutation({
    mutationFn: async (appointmentData) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const formattedData = {
        ...appointmentData,
        scheduledBy: appointmentData.scheduledBy,
      };

      console.log("📤 Sending Appointment Data:", formattedData);

      const response = await axios.post(`${API_BASE_URL}/appointments`, formattedData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    },
    onSuccess: () => {
      toast.success("✅ Appointment scheduled successfully!");
      reset();
      queryClient.invalidateQueries(["appointments"]);
    },
    onError: (error) => {
      toast.error(`❌ Error: ${error.response?.data?.message || "Failed to schedule appointment"}`);
    },
  });

  // ✅ Handle Quick Notes Storage
  const handleNotesChange = (e) => {
    setQuickNotes(e.target.value);
    localStorage.setItem("quickNotes", e.target.value);
  };

  return (
    <div className="scheduler-wrapper">
      {/* 📅 Left Sidebar */}
      <aside className="sidebar left-sidebar">
        <h2>📆 Quick Calendar</h2>
        <MiniCalendar onChange={setSelectedDate} value={selectedDate} />

        <h3>📝 Quick Notes</h3>
        <textarea
          value={quickNotes}
          onChange={handleNotesChange}
          placeholder="Write quick notes here..."
        />
      </aside>

      {/* 📝 Appointment Form */}
      <div className="scheduler-container">
        <h1 className="scheduler-title">Business Appointment Scheduler</h1>

        <div className="scheduler-scrollable">
          <form className="scheduler-form" onSubmit={handleSubmit(scheduleAppointment.mutate)}>
            
            {/* Left Side Fields */}
            <div className="left-side">
              <div className="form-group">
                <label>Title</label>
                <input {...register("title")} type="text" placeholder="Enter title" />
                <p className="error">{errors.title?.message}</p>
              </div>

              <div className="form-group">
                <label>Date</label>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      showTimeSelect
                      dateFormat="Pp"
                      placeholderText="Select date"
                    />
                  )}
                />
                <p className="error">{errors.date?.message}</p>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input {...register("location")} type="text" placeholder="Enter location" />
              </div>

              <div className="form-group">
                <label>Scheduled By</label>
                <Controller
                  control={control}
                  name="scheduledBy"
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={users.map((user) => ({
                        label: `${user.firstName} ${user.lastName}`,
                        value: user._id,
                      }))}
                      isLoading={isLoading}
                      placeholder="Select user"
                      onChange={(selectedOption) => field.onChange(selectedOption.value)}
                    />
                  )}
                />
                <p className="error">{errors.scheduledBy?.message}</p>
              </div>
            </div>

            {/* Right Side Fields */}
            <div className="right-side">
              <div className="form-group">
                <label>Contact Name</label>
                <input {...register("contactName")} type="text" placeholder="Enter name" />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input {...register("contactPhone")} type="text" placeholder="Enter phone" />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input {...register("contactEmail")} type="email" placeholder="Enter email" />
              </div>
            </div>

            {/* Notes */}
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea {...register("notes")} placeholder="Enter notes here..." />
            </div>

            <div className="button-container">
              <button type="submit" className="submit-button">
                {scheduleAppointment.isLoading ? "Scheduling..." : "Add Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 📋 Right Sidebar */}
      <aside className="sidebar right-sidebar">
        <h3>📋 Upcoming Appointments</h3>
        <ul>
          {appointments.slice(0, 10).map((appt) => (
            <li key={appt._id}>
              {new Date(appt.date).toLocaleDateString()} - {appt.title}
            </li>
          ))}
        </ul>
      </aside>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AppointmentScheduler;
