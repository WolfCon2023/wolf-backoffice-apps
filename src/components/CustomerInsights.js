import React, { useState, useEffect } from 'react';
import { Button, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AnalyticsService } from '../services';
import { toast } from 'react-toastify';
import './Analytics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CustomerInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsService.getCustomerInsights();
        setInsights(data);
      } catch (err) {
        toast.error('Failed to load customer insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) return <div>Loading insights...</div>;
  if (!insights) return <div>No insight data available</div>;

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
          Customer Insights
        </Typography>
      </div>

      <div className="analytics-grid">
        <div className="metric-card">
          <Typography variant="h6" gutterBottom>
            Customer Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card">
          <Typography variant="h6" gutterBottom>
            Customer Segments
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={insights}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {insights.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CustomerInsights; 