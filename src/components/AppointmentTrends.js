import React, { useState, useEffect } from 'react';
import { Button, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AnalyticsService } from '../services';
import { toast } from 'react-toastify';
import './Analytics.css';

const AppointmentTrends = () => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsService.getAppointmentTrends();
        // Format dates for better display
        const formattedData = data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString(),
        }));
        setTrends(formattedData);
      } catch (err) {
        toast.error('Failed to load appointment trends');
        console.error('Error fetching trends:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) return (
    <div className="analytics-container">
      <div className="loading-state">Loading trends data...</div>
    </div>
  );

  if (!trends) return (
    <div className="analytics-container">
      <div className="error-state">No trend data available</div>
    </div>
  );

  return (
    <div className="analytics-container">
      <div className="dashboard-header">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/analytics')}
          sx={{ mb: 2 }}
        >
          Back to Analytics Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Appointment Trends
        </Typography>
      </div>

      <div className="metric-card">
        <Typography variant="h6" gutterBottom>
          Appointment Volume Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[0, 'auto']}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              name="Appointments"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AppointmentTrends; 