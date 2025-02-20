import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./Calendar.css";

const Calendar = ({ openAppointmentModal }) => {
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
          description: appt.notes || "",
          formattedTime: new Date(appt.date).toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
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
    const nextWeekList = thisWeek.filter(appt => new Date(appt.start) >= nextWeek).slice(0, 5);

    setUpcomingAppointments(upcoming);
    setNextWeekAppointments(nextWeekList);
  };

  const handleEventClick = (clickInfo) => {
    openAppointmentModal(clickInfo.event.id, "view");
  };

  return (
    <div className="calendar-container">
      <h1 className="calendar-title">Business Calendar</h1>
      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          height="600px"
          scrollTime="08:00:00"
          events={events}
          eventClick={handleEventClick}
        />
      </div>
      <div className="appointments-sidebar">
        <h2>Upcoming Appointments This Week</h2>
        <ul>
          {upcomingAppointments.map((appt) => (
            <li key={appt.id} style={{ fontSize: "0.85rem" }}>{appt.formattedTime} - {appt.title}</li>
          ))}
        </ul>
        <h2>Upcoming Appointments Next Week</h2>
        <ul>
          {nextWeekAppointments.map((appt) => (
            <li key={appt.id} style={{ fontSize: "0.85rem" }}>{appt.formattedTime} - {appt.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Calendar;
