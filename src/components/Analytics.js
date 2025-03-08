import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsService } from '../services/AnalyticsService';
import { toast } from 'react-toastify';
import './Analytics.css';

const Analytics = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const getMonthDateRange = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate, endDate };
  };

  const handleExportMonthlyReport = async () => {
    try {
      setIsExporting(true);
      const dateRange = getMonthDateRange();
      await AnalyticsService.exportAnalyticsReport('monthly', dateRange, {
        format: 'pdf',
        includeCharts: true
      });
      toast.success('Monthly report generated successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to generate monthly report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="analytics-container">
      <h2>Analytics Dashboard</h2>
      
      <div className="analytics-actions">
        <button
          className="btn btn-primary"
          onClick={() => navigate('/analytics/metrics')}
        >
          View Business Metrics
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={handleExportMonthlyReport}
          disabled={isExporting}
        >
          {isExporting ? 'Generating Monthly Report...' : 'Generate Monthly Report'}
        </button>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <h3>Quick Stats</h3>
          <p>View comprehensive business metrics including:</p>
          <ul>
            <li>Appointment Trends</li>
            <li>Revenue Analysis</li>
            <li>Customer Distribution</li>
            <li>Location Performance</li>
          </ul>
        </div>

        <div className="summary-card">
          <h3>Export Options</h3>
          <p>Generate detailed reports with:</p>
          <ul>
            <li>Appointment Statistics</li>
            <li>Revenue Breakdown</li>
            <li>Customer Insights</li>
            <li>Performance Metrics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 