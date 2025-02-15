import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Fetching from:", API_BASE_URL);

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    axios
      .get(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setAppointments(response.data))
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setError("Failed to load appointments. Please try again.");
        if (error.response && error.response.status === 401) {
          console.warn("Unauthorized. Redirecting to login.");
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
  }, [navigate]);

  return (
    <div>
      <h1>Appointments</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {appointments.length > 0 ? (
          appointments.map((appt, index) => (
            <li key={index}>
              {appt.title} - {appt.date}
            </li>
          ))
        ) : (
          <p>No appointments available.</p>
        )}
      </ul>
    </div>
  );
};

export default Appointments;