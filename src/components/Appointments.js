import { useEffect, useState } from "react";
import axios from "axios";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    console.log("Fetching from:", process.env.REACT_APP_API_BASE_URL);

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/appointments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(response => setAppointments(response.data))
    .catch(error => console.error("Error fetching appointments:", error));
  }, []);

  return (
    <div>
      <h1>Appointments</h1>
      <ul>
        {appointments.map((appt, index) => (
          <li key={index}>{appt.title} - {appt.date}</li>
        ))}
      </ul>
    </div>
  );
};

export default Appointments;
