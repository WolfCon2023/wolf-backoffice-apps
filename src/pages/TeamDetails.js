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
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
import { api } from '../services/apiConfig';

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
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Team Member');
  const [users, setUsers] = useState([]);

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

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

  const handleAddTeamMember = async () => {
    try {
      if (!selectedUserId) {
        toast.error('Please select a user');
        return;
      }
      console.log('Adding team member:', { teamId: id, userId: selectedUserId, role: selectedRole });
      const response = await teamService.addTeamMember(id, selectedUserId, selectedRole);
      console.log('Team member added successfully:', response);
      toast.success('Team member added successfully');
      setOpenAddMemberDialog(false);
      setSelectedUserId('');
      setSelectedRole('Team Member'); // Reset role selection
      // Refresh team data
      const updatedTeam = await teamService.getTeamById(id);
      console.log('Updated team data:', updatedTeam);
      setTeam(updatedTeam);
    } catch (error) {
      console.error('Error adding team member:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
        toast.error(error.response.data.message || 'Failed to add team member');
      } else {
        toast.error('Failed to add team member');
      }
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

  const renderAddMemberDialog = () => (
    <Dialog open={openAddMemberDialog} onClose={() => setOpenAddMemberDialog(false)}>
      <DialogTitle>Add Team Member</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select User</InputLabel>
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {`${user.firstName} ${user.lastName}`} - {user.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            label="Role"
          >
            <MenuItem value="Team Member">Team Member</MenuItem>
            <MenuItem value="Scrum Master">Scrum Master</MenuItem>
            <MenuItem value="Developer">Developer</MenuItem>
            <MenuItem value="Business Analyst">Business Analyst</MenuItem>
            <MenuItem value="QA Tester">QA Tester</MenuItem>
            <MenuItem value="Product Owner">Product Owner</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenAddMemberDialog(false)}>Cancel</Button>
        <Button onClick={handleAddTeamMember} variant="contained" color="primary">
          Add Member
        </Button>
      </DialogActions>
    </Dialog>
  );

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
                      onClick={() => setOpenAddMemberDialog(true)}
                      variant="outlined"
                      color="primary"
                      sx={{ mb: 2 }}
                    >
                      Add Member
                    </Button>
                  </Box>
                  
                  {team.members && team.members.length > 0 ? (
                    <List>
                      {team.members.map((member) => (
                        <React.Fragment key={member._id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>{member.userId?.firstName ? member.userId.firstName.charAt(0) : 'U'}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${member.userId?.firstName} ${member.userId?.lastName}`}
                              secondary={
                                <React.Fragment>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {member.role}
                                  </Typography>
                                  {member.userId?.email && ` — ${member.userId.email}`}
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
      {renderAddMemberDialog()}
    </Container>
  );
};

export default TeamDetails; 