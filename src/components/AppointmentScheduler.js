import { useState } from "react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DatePicker from "react-datepicker";
import Select from "react-select";
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
  scheduledBy: yup.object().shape({
    value: yup.string().required("User must be selected"),
  }),
  notes: yup.string().notRequired(),
});

const AppointmentScheduler = () => {
  const queryClient = useQueryClient();

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

  // ✅ Mutation for Scheduling an Appointment
  const scheduleAppointment = useMutation({
    mutationFn: async (appointmentData) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      // ✅ Convert `scheduledBy` object to string ID before sending
      const formattedData = {
        ...appointmentData,
        scheduledBy: appointmentData.scheduledBy.value, // <-- FIX: Extract only `value`
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
    <div className="scheduler-container">
      <h1 className="scheduler-title">Business Appointment Scheduler</h1>

      <div className="scheduler-scrollable">
        <form className="scheduler-form" onSubmit={handleSubmit(scheduleAppointment.mutate)}>
          {/* Title Input */}
          <div className="form-group full-width">
            <label>Title</label>
            <input {...register("title")} type="text" placeholder="Enter appointment title" />
            <p className="error">{errors.title?.message}</p>
          </div>

          {/* Date Picker */}
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
                />
              )}
            />
            <p className="error">{errors.date?.message}</p>
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Location</label>
            <input {...register("location")} type="text" placeholder="Enter location" />
          </div>

          {/* Contact Name */}
          <div className="form-group">
            <label>Contact Name</label>
            <input {...register("contactName")} type="text" placeholder="Enter contact name" />
          </div>

          {/* Contact Phone */}
          <div className="form-group">
            <label>Contact Phone</label>
            <input {...register("contactPhone")} type="text" placeholder="Enter phone number" />
          </div>

          {/* Contact Email */}
          <div className="form-group">
            <label>Contact Email</label>
            <input {...register("contactEmail")} type="email" placeholder="Enter email" />
            <p className="error">{errors.contactEmail?.message}</p>
          </div>

          {/* Scheduled By (User Dropdown) */}
          <div className="form-group full-width">
            <label>Scheduled By</label>
            <Controller
              control={control}
              name="scheduledBy"
              render={({ field }) => (
                <Select
                  {...field}
                  options={users.map(user => ({
                    label: `${user.firstName} ${user.lastName} (${user.email})`,
                    value: user._id,
                  }))}
                  isLoading={isLoading}
                  placeholder="Select a user"
                />
              )}
            />
            <p className="error">{errors.scheduledBy?.value?.message}</p>
          </div>

          {/* Notes */}
          <div className="form-group full-width">
            <label>Notes</label>
            <textarea {...register("notes")} placeholder="Enter any notes" />
          </div>

          {/* Submit Button */}
          <div className="button-container">
            <button type="submit" className="submit-button">
              {scheduleAppointment.isLoading ? "Scheduling..." : "Add Appointment"}
            </button>
          </div>
        </form>
      </div>

      {/* ✅ Toast Container to Display Messages */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AppointmentScheduler;