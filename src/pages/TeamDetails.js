import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import teamService from '../services/teamService';

// Simple, clean TeamDetails component using teamService
const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.includes('/edit');
  
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [editedTeam, setEditedTeam] = useState({
    name: '',
    description: '',
    status: 'ACTIVE'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        console.log(`🔍 Fetching details for team ${id}...`);
        setLoading(true);
        
        const teamData = await teamService.getTeamById(id);
        console.log("✅ Team details received:", teamData);
        
        setTeam(teamData);
        
        // Initialize edit form with current values
        setEditedTeam({
          name: teamData.name || '',
          description: teamData.description || '',
          status: teamData.status || 'ACTIVE'
        });
      } catch (error) {
        console.error('❌ Error fetching team details:', error);
        toast.error('Failed to load team details');
        navigate('/teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id, navigate]);

  // Handle basic form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Form field changed: ${name} = ${value}`);
    
    setEditedTeam(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save team changes
  const handleSave = async () => {
    console.log('💾 Saving team information...');

    // Validate the team name
    if (!editedTeam.name || editedTeam.name.trim() === '') {
      toast.error('Team name is required');
      return;
    }

    // Check if there are any changes
    const hasNameChanged = editedTeam.name !== team.name;
    const hasDescriptionChanged = editedTeam.description !== team.description;
    const hasStatusChanged = editedTeam.status !== team.status;
    
    if (!hasNameChanged && !hasDescriptionChanged && !hasStatusChanged) {
      toast.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      
      // Handle status change separately for clarity
      if (hasStatusChanged) {
        console.log(`🔄 Status change detected from "${team.status}" to "${editedTeam.status}"`);
        await teamService.updateTeamStatus(team._id, editedTeam.status);
        console.log(`✅ Status updated successfully to "${editedTeam.status}"`);
      }
      
      // Handle name and description changes
      if (hasNameChanged || hasDescriptionChanged) {
        console.log('📝 Updating team name/description');
        await teamService.updateTeam(team._id, {
          name: editedTeam.name,
          description: editedTeam.description
        });
      }
      
      // Fetch the updated team to ensure we have the latest data
      const updatedTeam = await teamService.getTeamById(team._id);
      setTeam(updatedTeam);
      
      toast.success('Team info updated successfully');
      
      // Navigate back to Teams page
      navigate('/teams');
    } catch (error) {
      console.error('❌ Error updating team:', error);
      toast.error('Failed to update team information');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" color="error" align="center" sx={{ mt: 5 }}>
          Team not found
        </Typography>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/teams')}
          >
            Back to Teams
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/teams')}
          >
            Back to Teams
          </Button>
          
          {!isEditMode ? (
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<EditIcon />}
                onClick={() => navigate(`/teams/${id}/edit`)}
              >
                Edit
              </Button>
            </Box>
          ) : (
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave} 
                sx={{ mr: 1 }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<CancelIcon />}
                onClick={() => navigate(`/teams/${id}`)}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Team' : team.name}
        </Typography>
        
        {isEditMode ? (
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Team Name"
                  name="name"
                  value={editedTeam.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={editedTeam.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Status</Typography>
                <Chip 
                  label={editedTeam.status === 'ACTIVE' ? 'Active' : 
                         editedTeam.status === 'INACTIVE' ? 'Inactive' : 
                         editedTeam.status === 'ON_HOLD' ? 'On Hold' : editedTeam.status} 
                  color={
                    editedTeam.status === 'ACTIVE' ? 'success' : 
                    editedTeam.status === 'INACTIVE' ? 'default' :
                    editedTeam.status === 'ON_HOLD' ? 'warning' : 'default'
                  } 
                  size="small"
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Status can only be changed through the StratFlow Admin tool
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">Description</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {team.description || 'No description provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Status</Typography>
                      <Chip 
                        label={team.status === 'ACTIVE' ? 'Active' : 
                               team.status === 'INACTIVE' ? 'Inactive' : 
                               team.status === 'ON_HOLD' ? 'On Hold' : team.status} 
                        color={
                          team.status === 'ACTIVE' ? 'success' : 
                          team.status === 'INACTIVE' ? 'default' :
                          team.status === 'ON_HOLD' ? 'warning' : 'default'
                        } 
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Created</Typography>
                      <Typography variant="body1">{formatDate(team.createdAt)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Last Updated</Typography>
                      <Typography variant="body1">{formatDate(team.updatedAt)}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Team Members ({team.members?.length || 0})
                    </Typography>
                    <Button 
                      startIcon={<PersonAddIcon />}
                      variant="outlined"
                      size="small"
                    >
                      Add Member
                    </Button>
                  </Box>
                  
                  {team.members && team.members.length > 0 ? (
                    <List>
                      {team.members.map((member) => (
                        <React.Fragment key={member.id || member.user?._id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>{member.name ? member.name.charAt(0) : member.user?.name?.charAt(0) || 'U'}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={member.name || member.user?.name || 'Unknown User'}
                              secondary={
                                <React.Fragment>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {member.role || 'Team Member'}
                                  </Typography>
                                  {member.email && ` — ${member.email}`}
                                  {member.user?.email && ` — ${member.user.email}`}
                                </React.Fragment>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="Remove Member">
                                <IconButton edge="end" color="error" size="small">
                                  <PersonRemoveIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No members in this team yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Projects
                  </Typography>
                  {team.projects && team.projects.length > 0 ? (
                    <List>
                      {team.projects.map((project) => (
                        <ListItem key={project.id || project._id} button onClick={() => navigate(`/projects/${project.id || project._id}`)}>
                          <ListItemText 
                            primary={project.name} 
                            secondary={
                              <Box>
                                <Chip 
                                  label={project.status} 
                                  size="small" 
                                  color={project.status === 'Active' ? 'success' : 'default'} 
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No projects assigned to this team yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Metrics
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Average Velocity</Typography>
                      <Typography variant="body1">
                        {team.metrics?.velocity || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Capacity</Typography>
                      <Typography variant="body1">
                        {team.metrics?.capacity || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Completed Tasks</Typography>
                      <Typography variant="body1">
                        {team.metrics?.completedTasks || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">On-time Delivery</Typography>
                      <Typography variant="body1">
                        {team.metrics?.onTimeDelivery ? `${team.metrics.onTimeDelivery}%` : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default TeamDetails; 