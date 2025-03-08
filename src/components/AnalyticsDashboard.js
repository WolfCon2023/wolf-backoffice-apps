import React from 'react';
import { Button, Grid, Paper, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();

  const analyticsCards = [
    {
      title: 'Business Metrics',
      description: 'View comprehensive business performance metrics',
      icon: <AssessmentIcon fontSize="large" />,
      path: '/business-metrics'
    },
    {
      title: 'Revenue Analysis',
      description: 'Track revenue trends and financial performance',
      icon: <TrendingUpIcon fontSize="large" />,
      path: '/revenue-analysis'
    },
    {
      title: 'Customer Analytics',
      description: 'Analyze customer behavior and demographics',
      icon: <PeopleIcon fontSize="large" />,
      path: '/customer-analytics'
    },
    {
      title: 'Location Insights',
      description: 'Monitor performance across different locations',
      icon: <LocationOnIcon fontSize="large" />,
      path: '/location-insights'
    }
  ];

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/calendar')}
          sx={{ mb: 2 }}
        >
          Back to Success Calendar
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>
      </div>

      <Grid container spacing={3}>
        {analyticsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              className="analytics-card"
              elevation={3}
              onClick={() => navigate(card.path)}
              sx={{
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              <div className="card-icon">{card.icon}</div>
              <Typography variant="h6" component="h2" gutterBottom>
                {card.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default AnalyticsDashboard; 