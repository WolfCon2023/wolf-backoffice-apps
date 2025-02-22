import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Fetching appointments from:", API_BASE_URL);

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    // Default date range covering all appointments
    const defaultStartDate = "2000-01-01T00:00:00.000Z";
    const defaultEndDate = "2100-01-01T00:00:00.000Z";

    axios
      .get(
        `${API_BASE_URL}/appointments?startDate=${defaultStartDate}&endDate=${defaultEndDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        // Filter out appointments marked to be deleted
        const validAppointments = response.data.filter(
          (appt) => !appt.toBeDeleted
        );
        setAppointments(validAppointments);
      })
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
          appointments.map((appt) => (
            <li key={appt._id}>
              {appt.title} - {new Date(appt.date).toLocaleString()}
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
