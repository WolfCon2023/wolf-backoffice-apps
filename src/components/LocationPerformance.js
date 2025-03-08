import React, { useState, useEffect } from 'react';
import { Button, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
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
import './Analytics.css';

const LocationPerformance = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsService.getLocationPerformance();
        setPerformance(data);
      } catch (err) {
        toast.error('Failed to load location performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  if (loading) return <div>Loading performance data...</div>;
  if (!performance) return <div>No performance data available</div>;

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
          Location Performance
        </Typography>
      </div>

      <div className="metric-card">
        <Typography variant="h6" gutterBottom>
          Appointments by Location
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="location" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="appointments"
              fill="#8884d8"
              name="Appointments"
            />
            <Bar
              yAxisId="right"
              dataKey="revenue"
              fill="#82ca9d"
              name="Revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LocationPerformance; 