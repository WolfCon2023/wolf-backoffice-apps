import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./Calendar.css";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [nextWeekAppointments, setNextWeekAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/appointments`);
        const appointments = response.data.appointments.map((appt) => ({
          id: appt._id,
          title: appt.title,
          start: new Date(appt.date),
          location: appt.location || "N/A",
          scheduledBy: appt.scheduledBy || "N/A",
          contactName: appt.contactName || "N/A",
          contactPhone: appt.contactPhone || "N/A",
          contactEmail: appt.contactEmail || "N/A",
          description: appt.notes || "N/A",
          formattedTime: new Date(appt.date).toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        }));

        setEvents(appointments);
        organizeUpcomingAppointments(appointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };
    fetchAppointments();
  }, []);

  const organizeUpcomingAppointments = (appointments) => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const thisWeek = appointments.filter(appt => new Date(appt.start) >= now && new Date(appt.start) < nextWeek);
    const upcoming = thisWeek.slice(0, 5); // Limit to 5 for display
    const nextWeekList = appointments.filter(appt => new Date(appt.start) >= nextWeek).slice(0, 5);

    setUpcomingAppointments(upcoming);
    setNextWeekAppointments(nextWeekList);
  };

  const showAppointmentDetails = (appointment) => {
    const details = `Appointment: ${appointment.title}\nTime: ${appointment.formattedTime}\nLocation: ${appointment.location}\nScheduled By: ${appointment.scheduledBy}\nContact Name: ${appointment.contactName}\nContact Phone: ${appointment.contactPhone}\nContact Email: ${appointment.contactEmail}\nNotes: ${appointment.description}`;
    alert(details);
  };

  const handleEventClick = (clickInfo) => {
    showAppointmentDetails(clickInfo.event.extendedProps);
  };

  return (
    <div className="calendar-container" style={{ overflowY: "auto", maxHeight: "90vh", paddingBottom: "20px" }}>
      <h1 className="calendar-title">Business Calendar</h1>
      <div className="calendar-view" style={{ overflowY: "auto", maxHeight: "600px" }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          height="auto"
          events={events}
          eventClick={handleEventClick}
        />
      </div>
      <div className="appointments-container" style={{ display: "flex", justifyContent: "space-around", marginTop: "20px", gap: "20px", paddingBottom: "20px" }}>
        <div className="appointments-sidebar" style={{ overflowY: "scroll", maxHeight: "280px", width: "48%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9" }}>
          <h2>Upcoming Appointments This Week</h2>
          <ul style={{ maxHeight: "250px", overflowY: "scroll" }}>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appt) => (
                <li key={appt.id} style={{ fontSize: "0.85rem", cursor: "pointer" }} onClick={() => showAppointmentDetails(appt)}>
                  {appt.formattedTime} - {appt.title}
                </li>
              ))
            ) : (
              <li>No upcoming appointments</li>
            )}
          </ul>
        </div>
        <div className="appointments-sidebar" style={{ overflowY: "scroll", maxHeight: "280px", width: "48%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9" }}>
          <h2>Upcoming Appointments Next Week</h2>
          <ul style={{ maxHeight: "250px", overflowY: "scroll" }}>
            {nextWeekAppointments.length > 0 ? (
              nextWeekAppointments.map((appt) => (
                <li key={appt.id} style={{ fontSize: "0.85rem", cursor: "pointer" }} onClick={() => showAppointmentDetails(appt)}>
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
  );
};

export default Calendar;
