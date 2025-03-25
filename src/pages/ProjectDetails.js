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
  LinearProgress,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DeleteForever as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { projectService } from '../services/projectService';
import { toast } from 'react-toastify';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.includes('/edit');
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [editedProject, setEditedProject] = useState({
    name: '',
    description: '',
    status: '',
    methodology: '',
    startDate: '',
    targetEndDate: '',
    tags: []
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const projectData = await projectService.getProjectById(id);
        setProject(projectData);
        
        // Initialize edit form with current values
        setEditedProject({
          name: projectData.name || '',
          description: projectData.description || '',
          status: projectData.status || 'Active',
          methodology: projectData.methodology || 'Agile',
          startDate: projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '',
          targetEndDate: projectData.targetEndDate ? new Date(projectData.targetEndDate).toISOString().split('T')[0] : '',
          tags: projectData.tags || []
        });
      } catch (error) {
        console.error('Error fetching project details:', error);
        toast.error('Failed to load project details');
        navigate('/projects/list');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!editedProject.name) {
        toast.error('Project name is required');
        return;
      }

      const updatedData = {
        ...editedProject,
        startDate: editedProject.startDate ? new Date(editedProject.startDate).toISOString() : project.startDate,
        targetEndDate: editedProject.targetEndDate ? new Date(editedProject.targetEndDate).toISOString() : project.targetEndDate
      };

      const updatedProject = await projectService.updateProject(id, updatedData);
      setProject(updatedProject);
      toast.success('Project updated successfully');
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectService.deleteProject(id);
        toast.success('Project deleted successfully');
        navigate('/projects/list');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" color="error" align="center" sx={{ mt: 5 }}>
          Project not found
        </Typography>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<ArrowBack />}
            onClick={() => navigate('/projects/list')}
          >
            Back to Projects
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
            startIcon={<ArrowBack />}
            onClick={() => navigate('/projects/list')}
          >
            Back to Projects
          </Button>
          
          {!isEditMode ? (
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<EditIcon />}
                onClick={() => navigate(`/projects/${id}/edit`)}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Box>
          ) : (
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<CancelIcon />}
                onClick={() => navigate(`/projects/${id}`)}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Project' : project.name}
        </Typography>
        
        {isEditMode ? (
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Name"
                  name="name"
                  value={editedProject.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={editedProject.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={editedProject.status}
                    onChange={handleChange}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="On Hold">On Hold</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Methodology</InputLabel>
                  <Select
                    name="methodology"
                    value={editedProject.methodology}
                    onChange={handleChange}
                  >
                    <MenuItem value="Agile">Agile</MenuItem>
                    <MenuItem value="Waterfall">Waterfall</MenuItem>
                    <MenuItem value="Hybrid">Hybrid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={editedProject.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Target End Date"
                  name="targetEndDate"
                  type="date"
                  value={editedProject.targetEndDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">Description</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {project.description || 'No description provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Project Key</Typography>
                      <Chip label={project.key} color="primary" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Status</Typography>
                      <Chip 
                        label={project.status} 
                        color={
                          project.status === 'Active' ? 'success' : 
                          project.status === 'On Hold' ? 'warning' : 
                          project.status === 'Completed' ? 'default' : 'error'
                        } 
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Start Date</Typography>
                      <Typography variant="body1">{formatDate(project.startDate)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Target End Date</Typography>
                      <Typography variant="body1">{formatDate(project.targetEndDate)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Methodology</Typography>
                      <Typography variant="body1">{project.methodology}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Created</Typography>
                      <Typography variant="body1">{formatDate(project.createdAt)}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Progress
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" component="div" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.progress || 0} 
                      sx={{ height: 10, borderRadius: 5, mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Metrics
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Story Points</Typography>
                      <Typography variant="body1">
                        {project.metrics?.totalStoryPoints || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Completed</Typography>
                      <Typography variant="body1">
                        {project.metrics?.completedStoryPoints || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Velocity</Typography>
                      <Typography variant="body1">
                        {project.metrics?.velocity || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Avg. Cycle Time</Typography>
                      <Typography variant="body1">
                        {project.metrics?.avgCycleTime || 0} days
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

export default ProjectDetails; 