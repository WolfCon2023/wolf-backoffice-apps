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

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

// ✅ Form Validation Schema
const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  date: yup.date().required("Date is required"),
  location: yup.string().required("Location is required"),
  contactName: yup.string().required("Contact name is required"),
  contactPhone: yup.string().required("Contact phone is required"),
  contactEmail: yup.string().email("Invalid email").required("Contact email is required"),
  scheduledBy: yup
    .object()
    .shape({
      label: yup.string().required("User must be selected"),
      value: yup.string().required("User must be selected"),
    })
    .nullable()
    .required("User must be selected"),
  notes: yup.string().notRequired(),
});

const AppointmentScheduler = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [quickNotes, setQuickNotes] = useState(localStorage.getItem("quickNotes") || "");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue, // ✅ Added to update the scheduledBy field manually
    getValues, // ✅ Added to retrieve the current form values
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // ✅ Fetch Users with React Query
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
  });

  // ✅ Fetch Upcoming Appointments (Next 10 Appointments)
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 },
      });

      return response.data;
    },
  });

  // ✅ Mutation for Scheduling an Appointment
  const scheduleAppointment = useMutation({
    mutationFn: async (appointmentData) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const formattedData = {
        ...appointmentData,
        scheduledBy: appointmentData.scheduledBy.value, // ✅ Ensure correct value is sent
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

  return (
    <div className="scheduler-wrapper">
      {/* 📅 Left Sidebar */}
      <aside className="sidebar left-sidebar">
        <h2>📆 Quick Calendar</h2>
        <MiniCalendar onChange={setSelectedDate} value={selectedDate} />

        <h3>📝 Quick Notes</h3>
        <textarea
          value={quickNotes}
          onChange={(e) => {
            setQuickNotes(e.target.value);
            localStorage.setItem("quickNotes", e.target.value);
          }}
          placeholder="Write quick notes here..."
        />
      </aside>

      {/* 📝 Appointment Form */}
      <div className="scheduler-container">
        <h1 className="scheduler-title">Business Appointment Scheduler</h1>

        <form className="scheduler-form" onSubmit={handleSubmit(scheduleAppointment.mutate)}>
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              <label>Title</label>
              <input {...register("title")} type="text" placeholder="Enter title" />

              <label>Date</label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    showTimeSelect
                    dateFormat="Pp"
                    placeholderText="Select date"
                  />
                )}
              />

              <label>Location</label>
              <input {...register("location")} type="text" placeholder="Enter location" />

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
                    isLoading={usersLoading}
                    placeholder="Select user"
                    onChange={(selectedOption) => {
                      setValue("scheduledBy", selectedOption); // ✅ Fix to update field correctly
                    }}
                    value={getValues("scheduledBy") || null} // ✅ Display the selected value
                  />
                )}
              />
            </div>

            {/* Right Column */}
            <div className="form-column">
              <label>Contact Name</label>
              <input {...register("contactName")} type="text" placeholder="Enter name" />

              <label>Contact Phone</label>
              <input {...register("contactPhone")} type="text" placeholder="Enter phone" />

              <label>Contact Email</label>
              <input {...register("contactEmail")} type="email" placeholder="Enter email" />
            </div>
          </div>

          <label>Notes</label>
          <textarea {...register("notes")} placeholder="Enter notes" />

          <div className="button-container">
            <button type="submit" className="submit-button">
              {scheduleAppointment.isLoading ? "Scheduling..." : "Add Appointment"}
            </button>
          </div>
        </form>
      </div>

      {/* 📌 Upcoming Appointments */}
      <aside className="sidebar right-sidebar">
        <h3>📌 Upcoming Appointments</h3>
        <div className="upcoming-appointments">
          {appointmentsLoading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <li key={appt._id} onClick={() => setSelectedAppointment(appt)}>
                    {new Date(appt.date).toLocaleDateString()} - {appt.title}
                  </li>
                ))
              ) : (
                <li>No upcoming appointments</li>
              )}
            </ul>
          )}
        </div>
      </aside>

      {/* ✅ Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AppointmentScheduler;
