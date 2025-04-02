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
import incrementService from '../services/incrementService';

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
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    sprint: '',
    effortPoints: 0,
    priority: 'Medium',
    status: 'PLANNING'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First, ensure we have a valid token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view projects and sprints');
        return;
      }

      // Helper function for retrying failed requests
      const fetchWithRetry = async (fetchFn, entityName, maxRetries = 2, retryDelay = 1000) => {
        let retries = 0;
        let lastError = null;

        while (retries <= maxRetries) {
          try {
            console.log(`📡 Fetching ${entityName}...`);
            const data = await fetchFn();
            console.log(`✅ ${entityName} fetched successfully:`, data);
            return data || [];
          } catch (error) {
            lastError = error;
            
            // Don't retry 404 errors - these mean the endpoint doesn't exist
            if (error.response?.status === 404) {
              console.warn(`⚠️ ${entityName} endpoint returned 404 - Not implemented yet`);
              break;
            }
            
            // Don't retry unauthorized errors
            if (error.response?.status === 401 || error.response?.status === 403) {
              console.error(`❌ ${entityName} fetch failed: Authentication error`);
              break;
            }
            
            retries++;
            if (retries <= maxRetries) {
              console.warn(`⚠️ ${entityName} fetch attempt ${retries} failed, retrying in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }

        if (lastError) {
          console.error(`❌ Failed to fetch ${entityName} after ${retries} attempts:`, lastError);
          throw lastError;
        }
        
        return [];
      };

      // Fetch core data first - projects and sprints
      console.group('📊 Fetching Core Data');
      console.time('coreDataFetch');
      
      // Projects
      const projectsData = await fetchWithRetry(
        () => projectService.getAllProjects(),
        'projects'
      );
      setProjects(projectsData);
      
      // Sprints
      const sprintsData = await fetchWithRetry(
        () => sprintService.getAllSprints(),
        'sprints'
      );
      setSprints(sprintsData);
      
      console.timeEnd('coreDataFetch');
      console.groupEnd();

      // Only proceed with other data if we have projects
      if (projectsData.length > 0) {
        console.group('📊 Fetching Backlog Data');
        console.time('backlogDataFetch');
        
        // Fetch all backlog items in parallel
        const [incrementsData, featuresData, storiesData, tasksData, defectsData] = await Promise.allSettled([
          fetchWithRetry(() => incrementService.getAllIncrements(), 'increments'),
          fetchWithRetry(() => featureService.getAllFeatures(), 'features'),
          fetchWithRetry(() => storyService.getAllStories(), 'stories'),
          fetchWithRetry(() => taskService.getAllTasks(), 'tasks'),
          fetchWithRetry(() => defectService.getAllDefects(), 'defects')
        ]);

        // Set state based on the results
        setIncrements(incrementsData.status === 'fulfilled' ? incrementsData.value : []);
        setFeatures(featuresData.status === 'fulfilled' ? featuresData.value : []);
        setStories(storiesData.status === 'fulfilled' ? storiesData.value : []);
        setTasks(tasksData.status === 'fulfilled' ? tasksData.value : []);
        setDefects(defectsData.status === 'fulfilled' ? defectsData.value : []);

        // Log results
        console.group('📊 Backlog Data Results');
        console.log('Increments:', incrementsData.status === 'fulfilled' ? incrementsData.value.length : 0);
        console.log('Features:', featuresData.status === 'fulfilled' ? featuresData.value.length : 0);
        console.log('Stories:', storiesData.status === 'fulfilled' ? storiesData.value.length : 0);
        console.log('Tasks:', tasksData.status === 'fulfilled' ? tasksData.value.length : 0);
        console.log('Defects:', defectsData.status === 'fulfilled' ? defectsData.value.length : 0);
        console.groupEnd();

        console.timeEnd('backlogDataFetch');
        console.groupEnd();
      } else {
        console.warn('⚠️ No projects found, skipping backlog data fetch');
        setIncrements([]);
        setFeatures([]);
        setStories([]);
        setTasks([]);
        setDefects([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchData:', error);
      toast.error('Failed to fetch backlog data. Please try again later.');
      setError('Failed to fetch data');
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
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project: '',
      sprint: '',
      effortPoints: 0,
      priority: 'Medium',
      status: 'PLANNING'
    });
    setError('');
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

  const handleSubmit = async () => {
    try {
      if (!currentUser?.id) {
        console.error('No user ID found');
        setError('User ID not found. Please log in again.');
        return;
      }

      console.log('Current user:', currentUser);
      console.log('Reporter ID:', currentUser.id);

      if (!formData.title || !formData.project) {
        setError('Title and Project are required');
        return;
      }

      const baseData = {
        title: formData.title,
        description: formData.description,
        project: formData.project,
        sprint: formData.sprint || null,
        reporter: currentUser.id,
        status: formData.status,
        priority: formData.priority
      };

      if (dialogType === 'increment') {
        console.log('Creating increment with data:', baseData);
        await incrementService.createIncrement(baseData);
        console.log('Increment created successfully');
      } else if (dialogType === 'story') {
        const storyData = {
          ...baseData,
          storyPoints: parseInt(formData.effortPoints) || 0
        };

        console.log('Creating story with data:', storyData);
        await storyService.createStory(storyData);
        console.log('Story created successfully');
      }

      setOpenDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'An error occurred while saving');
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

  const handleDelete = async (id, type) => {
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
        setTasks(tasks.filter(t => t._id !== id));
      } else if (type === 'defect') {
        await defectService.deleteDefect(id);
        setDefects(defects.filter(d => d._id !== id));
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'info';
      case 'in progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const renderForm = () => {
    return (
      <Box component="form" noValidate autoComplete="off">
        <TextField
          fullWidth
          margin="normal"
          name="title"
          label="Title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          name="description"
          label="Description"
          value={formData.description}
          onChange={handleInputChange}
          multiline
          rows={4}
        />
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Project</InputLabel>
          <Select
            name="project"
            value={formData.project}
            onChange={handleInputChange}
          >
            <MenuItem value="">Select a project</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Sprint</InputLabel>
          <Select
            name="sprint"
            value={formData.sprint}
            onChange={handleInputChange}
          >
            <MenuItem value="">Select a sprint</MenuItem>
            {sprints.map((sprint) => (
              <MenuItem key={sprint._id} value={sprint._id}>
                {sprint.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <MenuItem value="PLANNING">Planning</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="ON_HOLD">On Hold</MenuItem>
          </Select>
        </FormControl>
        {dialogType === 'story' && (
          <TextField
            fullWidth
            margin="normal"
            name="effortPoints"
            label="Effort Points"
            type="number"
            value={formData.effortPoints}
            onChange={handleInputChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    );
  };

  const renderDialog = () => {
    return (
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'increment' ? 'Create Increment' : 'Create Story'}
        </DialogTitle>
        <DialogContent>
          {renderForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderTable = (type) => {
    let data = [];
    let columns = [];

    if (type === 'defect') {
      data = defects;
      columns = [
        { id: 'title', label: 'Title' },
        { id: 'description', label: 'Description' },
        { id: 'status', label: 'Status' },
        { id: 'severity', label: 'Severity' },
        { id: 'dateReported', label: 'Date Reported' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'story') {
      data = stories;
      columns = [
        { id: 'title', label: 'Title' },
        { id: 'description', label: 'Description' },
        { id: 'status', label: 'Status' },
        { id: 'severity', label: 'Severity' },
        { id: 'dateReported', label: 'Date Reported' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'task') {
      data = tasks;
      columns = [
        { id: 'title', label: 'Title' },
        { id: 'description', label: 'Description' },
        { id: 'status', label: 'Status' },
        { id: 'severity', label: 'Severity' },
        { id: 'dateReported', label: 'Date Reported' },
        { id: 'actions', label: 'Actions' },
      ];
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.status} 
                    color={getStatusColor(item.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.severity} 
                    color={getSeverityColor(item.severity)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(item.dateReported), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(type, item)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item._id, type)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
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
              activeTab === 1 ? 'story' :
              activeTab === 2 ? 'task' : 'defect'
            )}
          >
            New {
              activeTab === 0 ? 'Increment' : 
              activeTab === 1 ? 'Story' :
              activeTab === 2 ? 'Task' : 'Defect'
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

        {renderDialog()}
      </Box>
    </Container>
  );
};

export default Backlog; 