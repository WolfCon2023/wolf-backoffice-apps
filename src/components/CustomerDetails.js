import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaStar,
  FaHistory,
  FaEdit,
  FaArrowLeft,
  FaCalendarPlus
} from 'react-icons/fa';
import './CustomerDetails.css';

const CustomerDetails = ({ customer, onEdit }) => {
  const navigate = useNavigate();

  if (!customer) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No customer selected</Typography>
      </Box>
    );
  }

  const handleScheduleAppointment = () => {
    navigate('/schedule-appointment', { state: { customerId: customer._id } });
  };

  return (
    <Box className="customer-details">
      {/* Header */}
      <Box className="details-header" sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h4">Customer Details</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FaEdit />}
            onClick={() => onEdit(customer)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<FaCalendarPlus />}
            onClick={handleScheduleAppointment}
          >
            Schedule Appointment
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FaUser size={24} style={{ marginRight: '12px', color: '#1976d2' }} />
              <Typography variant="h6">
                {customer.firstName} {customer.lastName}
                {customer.highValue && (
                  <Tooltip title="High Value Customer">
                    <Chip
                      icon={<FaStar />}
                      label="High Value"
                      color="primary"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Tooltip>
                )}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <List>
              <ListItem>
                <FaEnvelope style={{ marginRight: '12px', color: '#666' }} />
                <ListItemText
                  primary="Email"
                  secondary={customer.businessEmail}
                />
              </ListItem>
              <ListItem>
                <FaPhone style={{ marginRight: '12px', color: '#666' }} />
                <ListItemText
                  primary="Phone"
                  secondary={customer.phoneNumber}
                />
              </ListItem>
              <ListItem>
                <FaBriefcase style={{ marginRight: '12px', color: '#666' }} />
                <ListItemText
                  primary="Product Line"
                  secondary={customer.productLines}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Interaction History */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FaHistory size={24} style={{ marginRight: '12px', color: '#1976d2' }} />
              <Typography variant="h6">Recent Interactions</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <List>
              {customer.interactions?.length > 0 ? (
                customer.interactions.map((interaction, index) => (
                  <ListItem key={index} divider={index !== customer.interactions.length - 1}>
                    <ListItemText
                      primary={interaction.type}
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(interaction.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2">
                            {interaction.notes}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    secondary="No recent interactions"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Additional Information</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Customer Since
                </Typography>
                <Typography>
                  {new Date(customer.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Updated
                </Typography>
                <Typography>
                  {new Date(customer.updatedAt).toLocaleDateString()}
                </Typography>
              </Grid>
              {customer.assignedRep && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Assigned Representative
                  </Typography>
                  <Typography>
                    {customer.assignedRep}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDetails; 