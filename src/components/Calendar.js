import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list"; // ✅ List View
import resourceTimelinePlugin from "@fullcalendar/resource-timeline"; // ✅ Timeline View
import momentPlugin from "@fullcalendar/moment"; // ✅ Moment.js Support
import bootstrapPlugin from "@fullcalendar/bootstrap"; // ✅ Bootstrap Styling
import adaptivePlugin from "@fullcalendar/adaptive"; // ✅ Mobile Optimizations
import "./Calendar.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [nextWeekAppointments, setNextWeekAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔍 Token Sent in Fetch Appointments:", token);

      if (!token) {
        console.warn("❌ No token found. Redirecting to login.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ API Response:", response.data.appointments);

      // ✅ Exclude appointments that are marked as deleted
      const filteredAppointments = response.data.appointments.filter(appt => !appt.toBeDeleted);
      console.log("✅ Filtered Appointments (Removing Deleted):", filteredAppointments);

      // ✅ Format events for FullCalendar
      const appointments = filteredAppointments.map((appt) => ({
        id: appt._id,
        title: appt.title,
        start: new Date(appt.date).toISOString(),  // ✅ Ensure ISO format
        extendedProps: {  // ✅ Store extra fields inside extendedProps
          location: appt.location || "N/A",
          scheduledBy: appt.scheduledBy || "N/A",
          contactName: appt.contactName || "N/A",
          contactPhone: appt.contactPhone || "N/A",
          contactEmail: appt.contactEmail || "N/A",
          description: appt.notes || "N/A",
        }
      }));

      setEvents(appointments);
      organizeUpcomingAppointments(appointments);
    } catch (error) {
      console.error("❌ Error fetching appointments:", error.response?.data || error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const organizeUpcomingAppointments = (appointments) => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const thisWeek = appointments.filter(appt => new Date(appt.start) >= now && new Date(appt.start) < nextWeek);
    const upcoming = thisWeek.slice(0, 5).map(appt => ({
      ...appt,
      formattedTime: formatDate(appt.start)
    }));

    const nextWeekList = appointments.filter(appt => new Date(appt.start) >= nextWeek).slice(0, 5).map(appt => ({
      ...appt,
      formattedTime: formatDate(appt.start)
    }));

    setUpcomingAppointments(upcoming);
    setNextWeekAppointments(nextWeekList);
  };

  const handleEventClick = (clickInfo) => {
    const eventData = clickInfo.event;

    if (!eventData || !eventData.title || !eventData.start) {
      console.error("❌ Missing event data:", eventData);
      alert("Error: Event details are missing.");
      return;
    }

    // ✅ Ensure all event fields have values
    const formattedStart = new Date(eventData.start).toLocaleString();

    const appointmentDetails = `
      Appointment: ${eventData.title || "N/A"}
      Time: ${formattedStart}
      Location: ${eventData.extendedProps.location || "N/A"}
      Scheduled By: ${eventData.extendedProps.scheduledBy || "N/A"}
      Contact Name: ${eventData.extendedProps.contactName || "N/A"}
      Contact Phone: ${eventData.extendedProps.contactPhone || "N/A"}
      Contact Email: ${eventData.extendedProps.contactEmail || "N/A"}
      Notes: ${eventData.extendedProps.description || "N/A"}
    `;

    alert(appointmentDetails);
  };

  return (
    <div className="calendar-container">
      <h1 className="calendar-title">Success Calendar</h1>
      <div className="calendar-view">
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin, // ✅ Adds List View
            resourceTimelinePlugin, // ✅ Adds Timeline View
            momentPlugin, // ✅ Enables Moment.js Support
            bootstrapPlugin, // ✅ Applies Bootstrap Styling
            adaptivePlugin, // ✅ Enhances Mobile Experience
          ]}
          initialView="dayGridMonth"
          themeSystem="bootstrap"
          events={events}
          eventClick={handleEventClick}
        />
      </div>
      <div className="appointments-sidebar">
        <div className="upcoming-appointments">
          <h2>Upcoming Appointments This Week</h2>
          <div className="scrollable-appointments">
            <ul>
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appt) => (
                  <li 
                    key={appt.id} 
                    style={{ fontSize: "0.85rem", cursor: "pointer", color: "blue", textDecoration: "underline" }}
                    onClick={() => handleEventClick({ event: { ...appt, extendedProps: appt } })}
                  >
                    {appt.formattedTime} - {appt.title}
                  </li>
                ))
              ) : (
                <li>No upcoming appointments</li>
              )}
            </ul>
          </div>
        </div>
        <div className="next-week-appointments">
          <h2>Upcoming Appointments Next Week</h2>
          <div className="scrollable-appointments">
            <ul>
              {nextWeekAppointments.length > 0 ? (
                nextWeekAppointments.map((appt) => (
                  <li 
                    key={appt.id} 
                    style={{ fontSize: "0.85rem", cursor: "pointer", color: "blue", textDecoration: "underline" }}
                    onClick={() => handleEventClick({ event: { ...appt, extendedProps: appt } })}
                  >
                    {appt.formattedTime} - {appt.title}
                  </li>
                ))
              ) : (
                <li>No appointments next week</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
