import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { AnalyticsService } from '../services';
import { toast } from 'react-toastify';
import './Analytics.css';

const Analytics = () => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      setExporting(true);
      await AnalyticsService.exportAnalyticsReport('monthly', { 
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      toast.success('Report exported successfully');
      setExportDialogOpen(false);
    } catch (error) {
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for max date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={() => setExportDialogOpen(true)}
        >
          Export Monthly Report
        </Button>
      </div>

      <div className="analytics-grid">
        <Link to="/analytics/metrics" className="analytics-card">
          <AssessmentIcon className="card-icon" />
          <div className="card-content">
            <h3>Business Metrics</h3>
            <p>View key performance indicators</p>
          </div>
        </Link>

        <Link to="/analytics/appointments/trends" className="analytics-card">
          <TrendingUpIcon className="card-icon" />
          <div className="card-content">
            <h3>Appointment Trends</h3>
            <p>Analyze appointment patterns</p>
          </div>
        </Link>

        <Link to="/analytics/customers/insights" className="analytics-card">
          <PeopleIcon className="card-icon" />
          <div className="card-content">
            <h3>Customer Insights</h3>
            <p>Understand customer behavior</p>
          </div>
        </Link>

        <Link to="/analytics/locations/performance" className="analytics-card">
          <LocationIcon className="card-icon" />
          <div className="card-content">
            <h3>Location Performance</h3>
            <p>Compare location metrics</p>
          </div>
        </Link>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Monthly Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select date range for the report
          </Typography>
          <div className="date-picker-container">
            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: endDate || today }}
              fullWidth
            />
            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: startDate, max: today }}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setExportDialogOpen(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExportReport}
            variant="contained"
            color="primary"
            disabled={!startDate || !endDate || exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Analytics; 