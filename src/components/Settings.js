import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import {
  FaUser,
  FaBell,
  FaPalette,
  FaClock,
  FaBuilding,
  FaArrowLeft
} from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [defaultView, setDefaultView] = useState('list');
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [alert, setAlert] = useState({ show: false, severity: 'success', message: '' });
  const [isSaving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  // Load saved settings when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode ?? false);
        setEmailNotifications(settings.emailNotifications ?? true);
        setDefaultView(settings.defaultView ?? 'list');
        setTimeZone(settings.timeZone ?? 'America/New_York');
        setDefaultDuration(settings.defaultDuration ?? 60);
        setBusinessName(settings.businessName ?? '');
        setBusinessHours(settings.businessHours ?? '');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all settings to localStorage
      const settingsToSave = {
        darkMode,
        emailNotifications,
        defaultView,
        timeZone,
        defaultDuration,
        businessName,
        businessHours
      };
      
      localStorage.setItem('userSettings', JSON.stringify(settingsToSave));

      // Apply dark mode
      document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

      setAlert({
        show: true,
        severity: 'success',
        message: 'Settings saved!'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setAlert({
        show: true,
        severity: 'error',
        message: 'Failed to save settings. Please try again.'
      });
    } finally {
      setSaving(false);
      // Keep the message visible for longer (5 seconds)
      setTimeout(() => setAlert({ show: false, severity: 'success', message: '' }), 5000);
    }
  };

  const renderUserPreferences = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Display & Appearance</Typography>
      <FormControlLabel
        control={<Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />}
        label="Dark Mode"
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Default View</Typography>
        <Select
          value={defaultView}
          onChange={(e) => setDefaultView(e.target.value)}
          size="small"
        >
          <MenuItem value="list">List View</MenuItem>
          <MenuItem value="calendar">Calendar View</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Time Zone</Typography>
        <Select
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          size="small"
        >
          <MenuItem value="America/New_York">Eastern Time</MenuItem>
          <MenuItem value="America/Chicago">Central Time</MenuItem>
          <MenuItem value="America/Denver">Mountain Time</MenuItem>
          <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );

  const renderNotifications = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Notification Preferences</Typography>
      <FormControlLabel
        control={<Switch checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />}
        label="Email Notifications"
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Default Reminder Time</Typography>
        <Select
          value={defaultDuration}
          onChange={(e) => setDefaultDuration(e.target.value)}
          size="small"
        >
          <MenuItem value={15}>15 minutes before</MenuItem>
          <MenuItem value={30}>30 minutes before</MenuItem>
          <MenuItem value={60}>1 hour before</MenuItem>
          <MenuItem value={1440}>1 day before</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );

  const renderBusinessSettings = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Business Information</Typography>
      <TextField
        fullWidth
        label="Business Name"
        variant="outlined"
        size="small"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Business Hours"
        variant="outlined"
        size="small"
        value={businessHours}
        onChange={(e) => setBusinessHours(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Default Appointment Duration"
        type="number"
        variant="outlined"
        size="small"
        value={defaultDuration}
        onChange={(e) => setDefaultDuration(Number(e.target.value))}
        sx={{ mb: 2 }}
      />
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
          aria-label="back to dashboard"
        >
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h5">Settings</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab icon={<FaPalette />} label="Preferences" />
            <Tab icon={<FaBell />} label="Notifications" />
            <Tab icon={<FaBuilding />} label="Business" />
          </Tabs>
        </Box>

        {activeTab === 0 && renderUserPreferences()}
        {activeTab === 1 && renderNotifications()}
        {activeTab === 2 && renderBusinessSettings()}

        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      {alert.show && (
        <Alert 
          severity={alert.severity}
          sx={{ 
            position: 'fixed', 
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: 3,
            minWidth: '300px',
            fontSize: '1rem',
            zIndex: 9999,
            textAlign: 'center',
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500,
              width: '100%',
              textAlign: 'center'
            }
          }}
        >
          {alert.message}
        </Alert>
      )}
    </Container>
  );
};

export default Settings; 