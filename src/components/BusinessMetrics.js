import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AnalyticsService } from '../services';
import { toast } from 'react-toastify';
import './BusinessMetrics.css';

const BusinessMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsService.getBusinessMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load business metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading metrics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="business-metrics-container">
      <h2>Business Metrics Dashboard</h2>

      {/* Appointments Trend */}
      <div className="metric-card">
        <h3>Appointments Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.appointments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="Appointments" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Analysis */}
      <div className="metric-card">
        <h3>Revenue Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.revenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#82ca9d" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Customer Insights */}
      <div className="metric-card">
        <h3>Customer Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.customers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Customers" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Location Performance */}
      <div className="metric-card">
        <h3>Location Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.locations}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="location" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="appointments" fill="#8884d8" name="Appointments" />
            <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BusinessMetrics; 