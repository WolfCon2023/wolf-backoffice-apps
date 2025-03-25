import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import sprintService from '../services/sprintService';
import { projectService } from '../services/projectService';

const SprintsPage = () => {
  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openNewSprintDialog, setOpenNewSprintDialog] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [newSprint, setNewSprint] = useState({
    name: '',
    project: '',
    goal: '',
    status: 'PLANNING',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    capacity: 10
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects first
        const projectsData = await projectService.getAllProjects();
        setProjects(projectsData);
        
        // Then fetch sprints
        const sprintsData = await sprintService.getAllSprints();
        setSprints(sprintsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load sprint data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    // Normalize status to uppercase for consistent matching
    const normalizedStatus = status?.toUpperCase();
    
    const statusColors = {
      ACTIVE: 'success',
      COMPLETED: 'default',
      ON_HOLD: 'warning',
      CANCELLED: 'error',
      PLANNED: 'info',
      PLANNING: 'info',
      IN_PROGRESS: 'primary',
    };
    
    return statusColors[normalizedStatus] || 'default';
  };

  const handleOpenNewSprint = () => {
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    setNewSprint({
      name: '',
      project: projects.length > 0 ? projects[0]._id : '',
      goal: '',
      status: 'PLANNING',
      startDate: today.toISOString().split('T')[0],
      endDate: twoWeeksFromNow.toISOString().split('T')[0],
      capacity: 10
    });
    setOpenNewSprintDialog(true);
  };

  const handleCloseNewSprint = () => {
    setOpenNewSprintDialog(false);
    setEditingSprint(null);
  };

  const handleSprintChange = (e) => {
    const { name, value } = e.target;
    setNewSprint(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSprint = async () => {
    try {
      // Log the current state
      console.log('Current newSprint state:', newSprint);
      console.log('Available projects:', projects);
      
      // Validate required fields
      if (!newSprint.name || !newSprint.project || !newSprint.startDate || !newSprint.endDate) {
        console.log('Missing fields:', {
          name: !newSprint.name,
          project: !newSprint.project,
          startDate: !newSprint.startDate,
          endDate: !newSprint.endDate
        });
        toast.error('Missing required fields');
        return;
      }

      // Format dates to ISO string
      const sprintData = {
        ...newSprint,
        startDate: new Date(newSprint.startDate).toISOString(),
        endDate: new Date(newSprint.endDate).toISOString(),
        status: 'PLANNING'  // Default status for new sprints
      };

      console.log('Creating sprint with data:', sprintData);
      const response = await sprintService.createSprint(sprintData);
      
      setSprints(prev => [...prev, response]);
      toast.success('Sprint created successfully');
      handleCloseNewSprint();
      
      // Refresh the data
      const updatedSprints = await sprintService.getAllSprints();
      setSprints(updatedSprints);
    } catch (error) {
      console.error('Failed to create sprint:', error);
      toast.error(`Failed to create sprint: ${error.message}`);
    }
  };

  const handleEditSprint = (sprint) => {
    console.log('Sprint being edited:', sprint);
    console.log('Sprint ID:', sprint._id || sprint.id);
    
    // Make sure we keep track of the correct ID
    const sprintWithId = {
      ...sprint,
      // Ensure we have a consistent ID field
      _id: sprint._id || sprint.id
    };
    
    setEditingSprint(sprintWithId);
    setNewSprint({
      name: sprint.name,
      project: sprint.project,
      goal: sprint.goal || '',
      status: sprint.status,
      startDate: new Date(sprint.startDate).toISOString().split('T')[0],
      endDate: new Date(sprint.endDate).toISOString().split('T')[0],
      capacity: sprint.capacity || 10
    });
    setOpenNewSprintDialog(true);
  };

  const handleUpdateSprint = async () => {
    try {
      // Validate required fields
      if (!newSprint.name || !newSprint.project || !newSprint.startDate || !newSprint.endDate) {
        toast.error('Missing required fields');
        return;
      }

      // Preserve the original status by getting it from the editingSprint
      const sprintData = {
        ...newSprint,
        status: editingSprint.status  // Keep the original status
      };

      // Use _id instead of id for MongoDB consistency
      const sprintId = editingSprint._id || editingSprint.id;
      console.log(`Updating sprint with ID: ${sprintId}`);
      
      const response = await sprintService.updateSprint(sprintId, sprintData);
      
      setSprints(prev => prev.map(s => (s._id || s.id) === sprintId ? response : s));
      toast.success('Sprint updated successfully');
      setEditingSprint(null);
      handleCloseNewSprint();
      
      // Refresh the data
      const updatedSprints = await sprintService.getAllSprints();
      setSprints(updatedSprints);
    } catch (error) {
      console.error('Failed to update sprint:', error);
      toast.error(`Failed to update sprint: ${error.message}`);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    try {
      await sprintService.deleteSprint(sprintId);
      
      setSprints(prev => prev.filter(s => (s._id || s.id) !== sprintId));
      toast.success('Sprint deleted successfully');
    } catch (error) {
      console.error('Failed to delete sprint:', error);
      toast.error(`Failed to delete sprint: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Sprint Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewSprint}
        >
          New Sprint
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sprints.length > 0 ? (
                  sprints.map((sprint) => {
                    const sprintId = sprint._id || sprint.id;
                    return (
                      <TableRow key={sprintId}>
                        <TableCell>{sprint.name}</TableCell>
                        <TableCell>
                          {projects.find(p => p._id === sprint.project)?.name || 
                           sprint.projectName || 'Unknown Project'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sprint.status}
                            color={getStatusColor(sprint.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(sprint.startDate)}</TableCell>
                        <TableCell>{formatDate(sprint.endDate)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditSprint(sprint)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSprint(sprintId)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No sprints found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* New/Edit Sprint Dialog */}
      <Dialog
        open={openNewSprintDialog}
        onClose={handleCloseNewSprint}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Sprint Name"
              name="name"
              value={newSprint.name}
              onChange={handleSprintChange}
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Project</InputLabel>
              <Select
                name="project"
                value={newSprint.project}
                onChange={handleSprintChange}
              >
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Goal"
              name="goal"
              value={newSprint.goal}
              onChange={handleSprintChange}
              margin="normal"
              multiline
              rows={2}
            />
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Status
              </Typography>
              <Chip
                label={newSprint.status || 'PLANNING'}
                color={getStatusColor(newSprint.status || 'PLANNING')}
                size="small"
              />
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Status can only be changed through the StratFlow Admin tool
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={newSprint.startDate}
                  onChange={handleSprintChange}
                  margin="normal"
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={newSprint.endDate}
                  onChange={handleSprintChange}
                  margin="normal"
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="Capacity (Story Points)"
              name="capacity"
              type="number"
              value={newSprint.capacity}
              onChange={handleSprintChange}
              margin="normal"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewSprint}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={editingSprint ? handleUpdateSprint : handleCreateSprint}
          >
            {editingSprint ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SprintsPage; 