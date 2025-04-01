import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  BugReport as BugIcon,
  Task as TaskIcon,
  Extension as FeatureIcon,
  Book as StoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { storyService } from '../services/storyService';
import taskService from '../services/taskService';
import defectService from '../services/defectService';
import featureService from '../services/featureService';
import { projectService } from '../services/projectService';
import sprintService from '../services/sprintService';

const Backlog = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [increments, setIncrements] = useState([]);
  const [features, setFeatures] = useState([]);
  const [stories, setStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [defects, setDefects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('increment');
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastUsedNumber, setLastUsedNumber] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    status: '',
    projectId: '',
    sprintId: '',
    assignee: '',
    type: '',
    effortPoints: '',
    featureId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // First, ensure we have a valid token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view projects and sprints');
        return;
      }

      // Fetch projects and sprints first
      try {
        console.log('Fetching projects and sprints...');
        const projectsData = await projectService.getAllProjects();
        console.log('Projects fetched:', projectsData);
        setProjects(projectsData || []);

        const sprintsData = await sprintService.getAllSprints();
        console.log('Sprints fetched:', sprintsData);
        setSprints(sprintsData || []);

        // Only proceed with other data if we have projects
        if (projectsData && projectsData.length > 0) {
          console.log('Fetching stories and other data...');
          
          // Fetch each type of data separately to handle errors individually
          try {
            const incrementsData = await storyService.getAllStories();
            setIncrements(incrementsData || []);
          } catch (error) {
            console.error('Error fetching increments:', error);
            setIncrements([]);
          }

          try {
            const storiesData = await storyService.getAllStories();
            setStories(storiesData || []);
          } catch (error) {
            console.error('Error fetching stories:', error);
            setStories([]);
          }

          try {
            const tasksData = await taskService.getAllTasks();
            setTasks(tasksData || []);
          } catch (error) {
            console.error('Error fetching tasks:', error);
            setTasks([]);
          }

          try {
            const defectsData = await defectService.getAllDefects();
            setDefects(defectsData || []);
          } catch (error) {
            console.error('Error fetching defects:', error);
            setDefects([]);
          }

          try {
            const featuresData = await featureService.getAllFeatures();
            setFeatures(featuresData || []);
          } catch (error) {
            console.error('Error fetching features:', error);
            setFeatures([]);
            // Don't show error toast for features since the endpoint doesn't exist yet
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        const errorMessage = error.response?.data?.message || error.message;
        toast.error(`Failed to load projects and sprints: ${errorMessage}`);
        
        // Set empty arrays as fallback
        setProjects([]);
        setSprints([]);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error('Failed to fetch backlog data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: '',
        status: '',
        projectId: '',
        sprintId: '',
        assignee: '',
        type: '',
        effortPoints: '',
        featureId: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add a function to get the next key number
  const getNextKey = () => {
    const nextNumber = lastUsedNumber + 1;
    setLastUsedNumber(nextNumber);
    return `BOAZ-${nextNumber}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const currentUser = getCurrentUser();
      console.log('Current user from token:', currentUser); // Debug log
      
      if (!currentUser || !currentUser.id) {
        console.error('No valid user ID found in token');
        toast.error('User authentication required');
        return;
      }

      const reporterId = currentUser.id;
      console.log('Using reporter ID:', reporterId); // Debug log
      
      if (dialogType === 'increment') {
        if (!formData.title || !formData.projectId) {
          toast.error('Title and Project are required fields');
          return;
        }

        const incrementData = {
          key: getNextKey(),
          title: formData.title,
          description: formData.description || '',
          priority: 'Medium',
          type: formData.type || 'Story',
          status: 'PLANNING',
          effortPoints: parseInt(formData.effortPoints) || 0,
          storyPoints: 0,
          assignee: formData.assignee || reporterId,
          reporter: reporterId,
          project: formData.projectId,
          sprint: formData.sprintId || null,
          feature: formData.featureId || null
        };

        console.log('Creating increment with data:', incrementData);
        console.log('Reporter ID being sent:', incrementData.reporter);
        console.log('Project ID being sent:', incrementData.project);

        const result = await storyService.createStory(incrementData);
        console.log('Increment created successfully:', result);
        toast.success('Increment created successfully');
      } else if (dialogType === 'feature') {
        const featureData = {
          name: formData.title,
          description: formData.description,
          status: 'PLANNED',
          priority: formData.priority || 'LOW',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log('Creating feature with data:', featureData);
        const result = await featureService.createFeature(featureData);
        console.log('Feature created successfully:', result);
        toast.success('Feature created successfully');
      } else if (dialogType === 'story') {
        if (!formData.title || !formData.projectId) {
          toast.error('Title and Project are required fields');
          return;
        }

        const storyData = {
          key: getNextKey(),
          title: formData.title,
          description: formData.description || '',
          priority: 'Medium',
          type: 'Story',
          status: 'PLANNING',
          effortPoints: parseInt(formData.effortPoints) || 0,
          storyPoints: 0,
          assignee: formData.assignee || reporterId,
          reporter: reporterId,
          project: formData.projectId,
          sprint: formData.sprintId || null,
          feature: formData.featureId || null
        };

        console.log('Creating story with data:', storyData);
        console.log('Reporter ID being sent:', storyData.reporter);
        console.log('Project ID being sent:', storyData.project);

        const result = await storyService.createStory(storyData);
        console.log('Story created successfully:', result);
        toast.success('Story created successfully');
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error creating item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create item';
      toast.error(errorMessage);
    }
  };

  // Get current user function
  const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return null;
    }
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedToken = JSON.parse(jsonPayload);
      console.log('Full decoded token:', decodedToken); // Debug log
      
      // Make sure we have an ID
      if (!decodedToken.id) {
        console.error('No id field found in token payload:', decodedToken);
        return null;
      }
      
      return {
        id: decodedToken.id, // Use the id field from the token
        email: decodedToken.email,
        name: decodedToken.name
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'increment') {
        await storyService.deleteStory(id);
        setIncrements(increments.filter(i => i._id !== id));
      } else if (type === 'feature') {
        await featureService.deleteFeature(id);
        setFeatures(features.filter(f => f._id !== id));
      } else if (type === 'story') {
        await storyService.deleteStory(id);
        setStories(stories.filter(s => s._id !== id));
      } else if (type === 'task') {
        await taskService.deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
      } else if (type === 'defect') {
        await defectService.deleteDefect(id);
        setDefects(defects.filter(d => d.id !== id));
      }
      toast.success(`${type} deleted successfully!`);
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Backlog': 'default',
      'To Do': 'info',
      'In Progress': 'primary',
      'In Review': 'warning',
      'Done': 'success',
      'Blocked': 'error',
    };
    return statusColors[status] || 'default';
  };

  const renderDialogContent = () => {
    console.log('Current Projects:', projects);
    console.log('Current Sprints:', sprints);
    
    return (
      <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Title"
          name="title"
          fullWidth
          required
          value={formData.title || ''}
          onChange={handleInputChange}
          error={!formData.title && formData.title !== undefined}
          helperText={!formData.title && formData.title !== undefined ? 'Title is required' : ''}
        />
        <TextField
          label="Description"
          name="description"
          fullWidth
          multiline
          rows={4}
          value={formData.description || ''}
          onChange={handleInputChange}
        />
        <FormControl fullWidth required>
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={formData.priority || 'Medium'}
            onChange={handleInputChange}
            label="Priority"
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </Select>
        </FormControl>
        {dialogType === 'increment' && (
          <>
            <FormControl fullWidth required>
              <InputLabel>Increment Type</InputLabel>
              <Select
                name="type"
                value={formData.type || 'Story'}
                onChange={handleInputChange}
                label="Increment Type"
              >
                <MenuItem value="Story">Story</MenuItem>
                <MenuItem value="Task">Task</MenuItem>
                <MenuItem value="Defect">Defect</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status || 'PLANNING'}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="PLANNING">Planning</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Feature</InputLabel>
              <Select
                name="featureId"
                value={formData.featureId || ''}
                onChange={handleInputChange}
                label="Feature"
              >
                <MenuItem value="">None</MenuItem>
                {features.map(feature => (
                  <MenuItem key={feature._id} value={feature._id}>
                    {feature.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required error={!formData.projectId}>
              <InputLabel>Project</InputLabel>
              <Select
                name="projectId"
                value={formData.projectId || ''}
                onChange={handleInputChange}
                label="Project"
              >
                <MenuItem value="">Select a project</MenuItem>
                {projects && projects.length > 0 ? (
                  projects.map(project => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No projects available</MenuItem>
                )}
              </Select>
              {!formData.projectId && (
                <FormHelperText>Project is required</FormHelperText>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Sprint</InputLabel>
              <Select
                name="sprintId"
                value={formData.sprintId || ''}
                onChange={handleInputChange}
                label="Sprint"
              >
                <MenuItem value="">None</MenuItem>
                {sprints && sprints.length > 0 ? (
                  sprints.map(sprint => (
                    <MenuItem key={sprint._id} value={sprint._id}>
                      {sprint.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No sprints available</MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              label="Effort Points"
              name="effortPoints"
              type="number"
              fullWidth
              value={formData.effortPoints || ''}
              onChange={handleInputChange}
              inputProps={{ min: 0, step: 1 }}
            />
          </>
        )}
      </Box>
    );
  };

  const renderTable = (type) => {
    let data = [];
    let columns = [];

    if (type === 'increment') {
      data = increments;
      columns = [
        { id: 'title', label: 'Title' },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' },
        { id: 'effortPoints', label: 'Effort Points' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'feature') {
      data = features;
      columns = [
        { id: 'name', label: 'Name' },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'story') {
      data = stories;
      columns = [
        { id: 'title', label: 'Title' },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' },
        { id: 'effortPoints', label: 'Effort Points' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'task') {
      data = tasks;
      columns = [
        { id: 'title', label: 'Title' },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' },
        { id: 'effortPoints', label: 'Effort Points' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'defect') {
      data = defects;
      columns = [
        { id: 'title', label: 'Title' },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' },
        { id: 'actions', label: 'Actions' },
      ];
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item._id || item.id}>
                  {columns.map((column) => {
                    if (column.id === 'actions') {
                      return (
                        <TableCell key={column.id}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(type, item)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(type, item._id || item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      );
                    }
                    if (column.id === 'status') {
                      return (
                        <TableCell key={column.id}>
                          <Chip
                            label={item[column.id]}
                            size="small"
                            color={getStatusColor(item[column.id])}
                          />
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={column.id}>{item[column.id]}</TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No {type}s found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Backlog</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(
              activeTab === 0 ? 'increment' : 
              activeTab === 1 ? 'feature' : 
              activeTab === 2 ? 'story' :
              activeTab === 3 ? 'task' : 'defect'
            )}
          >
            New {
              activeTab === 0 ? 'Increment' : 
              activeTab === 1 ? 'Feature' : 
              activeTab === 2 ? 'Story' :
              activeTab === 3 ? 'Task' : 'Defect'
            }
          </Button>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab
            icon={<AssignmentIcon />}
            label="Increments"
            iconPosition="start"
          />
          <Tab
            icon={<FeatureIcon />}
            label="Features"
            iconPosition="start"
          />
          <Tab
            icon={<StoryIcon />}
            label="Stories"
            iconPosition="start"
          />
          <Tab
            icon={<TaskIcon />}
            label="Tasks"
            iconPosition="start"
          />
          <Tab
            icon={<BugIcon />}
            label="Defects"
            iconPosition="start"
          />
        </Tabs>

        {activeTab === 0 && renderTable('increment')}
        {activeTab === 1 && renderTable('feature')}
        {activeTab === 2 && renderTable('story')}
        {activeTab === 3 && renderTable('task')}
        {activeTab === 4 && renderTable('defect')}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedItem ? 'Edit' : 'Create'} {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
          </DialogTitle>
          <DialogContent>
            {renderDialogContent()}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {selectedItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Backlog; 