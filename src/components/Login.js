import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import "./Login.css"; // ✅ New CSS file for styling

const Login = ({ setAuthToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const token = response.data.token;

      localStorage.setItem("token", token);
      setAuthToken(token);

      // ✅ Wait a short time before navigating to ensure state updates
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
