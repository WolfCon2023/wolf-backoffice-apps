import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const Calendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const appointmentsRes = await axios.get("https://your-backend-url/api/appointments");
        const eventsRes = await axios.get("https://your-backend-url/api/events");

        const formattedEvents = [...appointmentsRes.data, ...eventsRes.data].map((event) => ({
          title: event.title,
          start: event.date,
          description: event.notes || "",
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div>
      <h1>Business Calendar</h1>
      <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" events={events} />
    </div>
  );
};

export default Calendar;
