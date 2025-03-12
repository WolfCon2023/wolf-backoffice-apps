import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import jwtDecode from "jwt-decode";
import Login from "./components/Login";
import AppointmentsDashboard from "./components/AppointmentsDashboard";
import AppointmentScheduler from "./components/AppointmentScheduler";
import Calendar from "./components/Calendar";
import CustomerCRM from "./components/CustomerCRM";
import CustomerDetails from "./components/CustomerDetails";
import AppointmentDetails from "./components/AppointmentDetails";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Analytics from "./components/Analytics";
import BusinessMetrics from "./components/BusinessMetrics";
import AppointmentTrends from './components/AppointmentTrends';
import CustomerInsights from './components/CustomerInsights';
import LocationPerformance from './components/LocationPerformance';
import Settings from './components/Settings';
import Help from './components/Help';
// Import StratFlow components
import Projects from './components/Projects';
import Teams from './components/Teams';
import Roadmap from './components/Roadmap';
import StratflowDashboard from './components/StratflowDashboard';
import DashboardLayout from './components/DashboardLayout';
import Backlog from './components/Backlog';
import Metrics from './components/Metrics';

// Create a QueryClient instance with configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setUsername(decodedToken.username);
      } catch (error) {
        console.error("❌ Error decoding token:", error);
        setAuthToken(""); // Reset authToken if invalid
        localStorage.removeItem("token"); // Ensure token is removed if invalid
      }
    }
  }, [authToken]);

  // Helper function to wrap routes that need the DashboardLayout
  const withDashboardLayout = (Component) => {
    return authToken ? (
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    ) : (
      <Navigate to="/login" />
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app-container">
          <Header username={username} setAuthToken={setAuthToken} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={authToken ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
              <Route path="/login" element={<Login setAuthToken={setAuthToken} />} />
              <Route path="/dashboard" element={authToken ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/appointments" element={authToken ? <AppointmentsDashboard /> : <Navigate to="/login" />} />
              <Route path="/schedule-appointment" element={authToken ? <AppointmentScheduler /> : <Navigate to="/login" />} />
              <Route path="/calendar" element={authToken ? <Calendar /> : <Navigate to="/login" />} />
              <Route path="/crm" element={authToken ? <CustomerCRM /> : <Navigate to="/login" />} />
              <Route path="/customer/:id" element={authToken ? <CustomerDetails /> : <Navigate to="/login" />} />
              <Route path="/appointment/:id" element={authToken ? <AppointmentDetails /> : <Navigate to="/login" />} />
              <Route path="/analytics" element={authToken ? <Analytics /> : <Navigate to="/login" />} />
              <Route path="/analytics/metrics" element={authToken ? <BusinessMetrics /> : <Navigate to="/login" />} />
              <Route 
                path="/analytics/appointments/trends" 
                element={authToken ? <AppointmentTrends /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/analytics/customers/insights" 
                element={authToken ? <CustomerInsights /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/analytics/locations/performance" 
                element={authToken ? <LocationPerformance /> : <Navigate to="/login" />} 
              />
              <Route path="/settings" element={authToken ? <Settings /> : <Navigate to="/login" />} />
              <Route path="/help" element={authToken ? <Help /> : <Navigate to="/login" />} />

              {/* StratFlow Routes */}
              <Route path="/projects" element={withDashboardLayout(StratflowDashboard)} />
              <Route path="/projects/list" element={withDashboardLayout(Projects)} />
              <Route path="/teams" element={withDashboardLayout(Teams)} />
              <Route path="/roadmap" element={withDashboardLayout(Roadmap)} />
              <Route path="/backlog" element={withDashboardLayout(Backlog)} />
              <Route path="/metrics" element={withDashboardLayout(Metrics)} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer username={username} />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 