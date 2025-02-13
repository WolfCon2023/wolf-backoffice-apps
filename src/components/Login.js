import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = ({ setAuthToken }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log("🔍 Sending Login Request:", { email, password });

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            console.log("✅ Server Response:", response.data);

            localStorage.setItem("token", response.data.token);
            setAuthToken(response.data.token);
            console.log("✅ Token Stored:", localStorage.getItem("token"));
            navigate("/dashboard");
        } catch (error) {
            console.error("❌ Login failed", error.response?.data || error.message);
            alert("Invalid credentials. Please try again.");
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
