import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Link } from "react-router-dom"; // Importing Link for routing
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";
import { Button } from "@mui/material"; // Importing the button

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://wolf-backoffice-backend-development.up.railway.app/api";

const localizer = momentLocalizer(moment);

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found.");
        setError("No token found. Please log in.");
        return;
      }

      // Use a wide date range to load all appointments
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

      // Filter out appointments marked to be deleted
      const activeAppointments = response.data.filter(
        (appt) => !appt.toBeDeleted
      );

      // Map appointments to events (assuming a default duration of 1 hour)
      const mappedEvents = activeAppointments.map((appt) => {
        const start = new Date(appt.date);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // default duration of 1 hour
        return {
          id: appt._id,
          title: appt.title,
          start: start,
          end: end,
          resource: {
            location: appt.location || "N/A",
            scheduledBy: appt.scheduledBy || "N/A",
            contactName: appt.contactName || "N/A",
            contactPhone: appt.contactPhone || "N/A",
            contactEmail: appt.contactEmail || "N/A",
            description: appt.notes || "N/A",
          },
        };
      });

      setEvents(mappedEvents);
    } catch (error) {
      console.error(
        "❌ Error fetching appointments:",
        error.response ? error.response.data : error.message
      );
      setError(
        error.response && error.response.data
          ? JSON.stringify(error.response.data)
          : error.message
      );
    }
  };

  const eventStyleGetter = (event, start, end, isSelected) => {
    const style = {
      backgroundColor: "#0056b3",
      borderRadius: "5px",
      opacity: 0.85,
      color: "white",
      border: "0px",
      display: "block",
    };
    return { style };
  };

  const onSelectEvent = (event) => {
    const details = `
Appointment: ${event.title}
Time: ${event.start.toLocaleString()} - ${event.end.toLocaleString()}
Location: ${event.resource.location}
Scheduled By: ${event.resource.scheduledBy}
Contact Name: ${event.resource.contactName}
Contact Phone: ${event.resource.contactPhone}
Contact Email: ${event.resource.contactEmail}
Notes: ${event.resource.description}`;
    alert(details);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-actions">
        {/* These buttons now navigate properly */}
        <Link to="/appointments" style={{ marginRight: "10px" }}>
          <Button variant="contained">Appointments Dashboard</Button>
        </Link>
        <Link to="/schedule-appointment">
          <Button variant="contained">Appointment Scheduler</Button>
        </Link>
      </div>
      <h1 className="calendar-title">Success Calendar</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="calendar-view">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }} // Ensure full calendar is visible
          eventPropGetter={eventStyleGetter}
          onSelectEvent={onSelectEvent}
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
          popup={true}
        />
      </div>
    </div>
  );
};

export default Calendar;
