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
  Divider,
  Alert,
  Badge,
  Avatar,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  BugReport as BugIcon,
  Task as TaskIcon,
  DragIndicator as DragIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { projectService } from '../services/projectService';
import sprintService from '../services/sprintService';
import incrementService from '../services/incrementService';
import { userService } from '../services/userService';

const Backlog = () => {
  console.log('🔄 Backlog component rendering...');

  const [loading, setLoading] = useState(true);
  const [backlogData, setBacklogData] = useState({
    sprints: [],
    backlogItems: []
  });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [incrementType, setIncrementType] = useState('story');
  const [selectedItem, setSelectedItem] = useState(null);
  const [sprintsForDropdown, setSprintsForDropdown] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Backlog',
    project: '',
    sprint: '',
    assignedTo: '',
    createdBy: '',
    storyPoints: '',
    incrementType: 'story',
    estimatedHours: '',
    severity: '',
  });

  // Add new state for form validation errors
  const [formErrors, setFormErrors] = useState({
    title: false,
    project: false,
  });

  // Add a new state to track submission in progress
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBacklogData(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    // Add effect to update sprint dropdown options at component level
    if (backlogData.sprints && backlogData.sprints.length > 0) {
      setSprintsForDropdown(backlogData.sprints);
      console.log('Using sprints from backlogData for dropdown:', backlogData.sprints.length);
    } else {
      // Otherwise fetch them directly
      const fetchSprintsForDropdown = async () => {
        try {
          console.log('Fetching sprints directly for dropdown...');
          const fetchedSprints = await sprintService.getAllSprints();
          console.log('Fetched sprints for dropdown:', fetchedSprints.length);
          setSprintsForDropdown(fetchedSprints);
        } catch (error) {
          console.error('Failed to fetch sprints for dropdown:', error);
        }
      };
      
      fetchSprintsForDropdown();
    }
  }, [backlogData.sprints]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [projectsData, usersData] = await Promise.all([
        projectService.getAllProjects(),
        userService.getAllUsers()
      ]);

      setProjects(projectsData);
      setUsers(usersData);
      
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch initial data');
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchBacklogData = async (projectId) => {
    try {
      setLoading(true);
      console.log(`Fetching backlog data for project ${projectId}...`);
      
      // First, let's get the sprints for this project specifically
      console.log('Fetching sprints by project ID...');
      const projectSprints = await sprintService.getSprintsByProject(projectId);
      console.log(`Found ${projectSprints.length} sprints for project ${projectId}`);
      
      // Then get backlog data
      const data = await incrementService.getBacklogData(projectId);
      console.log('Backlog data received:', data);
      
      // Debug sprint data
      if (data.sprints) {
        console.log('SPRINTS DEBUG FROM API:');
        data.sprints.forEach(sprint => {
          console.log(`Sprint from API: ${sprint.name}, Status: ${sprint.status}, ID: ${sprint._id}`);
        });
      } else {
        console.error('No sprints array in API response!');
      }
      
      console.log('PROJECT SPRINTS FROM DIRECT FETCH:');
      projectSprints.forEach(sprint => {
        console.log(`Sprint from direct fetch: ${sprint.name}, Status: ${sprint.status}, ID: ${sprint._id}`);
      });
      
      // Check if we have valid data structure
      if (!data.sprints || !data.backlogItems) {
        console.warn('Invalid backlog data format received:', data);
        toast.warning('Backend returned invalid data format');
      }
      
      // Merge sprints from both sources
      const combinedSprints = [...projectSprints];
      
      // Add any sprints from backlog data that aren't already in the direct fetch results
      if (data.sprints && data.sprints.length > 0) {
        data.sprints.forEach(backlogSprint => {
          // Check if this sprint is already in our combined list
          const alreadyExists = combinedSprints.some(
            sprint => sprint._id === backlogSprint._id
          );
          
          // If not already in the list, add it
          if (!alreadyExists) {
            combinedSprints.push(backlogSprint);
          } else {
            // If it exists, make sure it has the increments data
            const existingIndex = combinedSprints.findIndex(
              sprint => sprint._id === backlogSprint._id
            );
            
            if (existingIndex !== -1 && backlogSprint.increments) {
              combinedSprints[existingIndex].increments = backlogSprint.increments;
            }
          }
        });
      }
      
      console.log(`Combined ${combinedSprints.length} sprints from both sources`);
      
      // Set the data with our merged sprints list
      setBacklogData({
        sprints: combinedSprints,
        backlogItems: data.backlogItems || []
      });
    } catch (error) {
      console.error('Error fetching backlog data:', error);
      toast.error('Failed to fetch backlog data: ' + error.message);
      // Set empty data to prevent rendering errors
      setBacklogData({
        sprints: [],
        backlogItems: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
  };

  const handleOpenDialog = (type, item = null) => {
    setIncrementType(type);
    setSelectedItem(item);
    
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        priority: item.priority || 'Medium',
        status: item.status || 'Backlog',
        project: item.project?._id || item.project || selectedProject,
        sprint: item.sprint?._id || item.sprint || '',
        assignedTo: item.assignedTo?._id || item.assignedTo || '',
        storyPoints: item.storyPoints || '',
        incrementType: item.incrementType || type,
        estimatedHours: item.estimatedHours || '',
        severity: item.severity || '',
      });
    } else {
      // New increment defaults
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Backlog',
        project: selectedProject,
        sprint: '',
        assignedTo: '',
        storyPoints: '',
        incrementType: type,
        estimatedHours: '',
        severity: '',
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
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      title: !formData.title,
      project: !formData.project,
    };
    
    setFormErrors(errors);
    
    // Form is valid if no errors are true
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log('🛑 Already submitting, preventing duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    console.log('🔍 DEBUG: handleSubmit called! Timestamp:', new Date().toISOString());
    console.log('🔍 DEBUG: Form data at submission time:', JSON.stringify(formData, null, 2));
    
    // Check if we can directly access the network API to test connectivity
    try {
      const networkStatus = navigator.onLine 
        ? '✅ Browser reports online' 
        : '❌ Browser reports offline';
      console.log(networkStatus);
    } catch (e) {
      console.warn('Could not check network status:', e);
    }
    
    document.activeElement.blur(); // Blur active element to prevent double submission
    
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const currentUserId = userData?._id;
      const token = localStorage.getItem('token');
      
      console.log('🔑 Token available:', token ? '✅ Yes' : '❌ No');
      
      if (!currentUserId) {
        toast.error('User information not found. Please login again.');
        return;
      }
      
      // Validate the form
      if (!validateForm()) {
        console.warn('Form validation failed');
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Prepare data for API
      const incrementData = {
        ...formData,
        createdBy: currentUserId,
        // Map incrementType to type for the API (backend expects 'type')
        type: formData.type || formData.incrementType,
      };
      
      // Remove the incrementType field to avoid confusing the API
      delete incrementData.incrementType;
      
      console.log('💾 Preparing to create increment with data:', JSON.stringify(incrementData, null, 2));
      console.log('👤 Current user ID:', currentUserId);
      console.log('🏢 Selected project:', formData.project);
      console.log('🏃 Selected sprint:', formData.sprint);
      
      // If creating a new increment, attempt a direct fetch first to check API connectivity
      if (!selectedItem) {
        try {
          console.log('🔌 Testing API connectivity...');
          const testResult = await fetch(`${process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api"}/health`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('🔌 API health check status:', testResult.status);
          if (testResult.ok) {
            console.log('🔌 API health check response:', await testResult.text());
          }
        } catch (connectError) {
          console.warn('🔌 API connection test failed:', connectError);
        }
      }
      
      try {
        console.log('⏱️ Starting API request at:', new Date().toISOString());
        
        if (selectedItem) {
          console.log(`📝 Updating increment ${selectedItem._id}...`);
          const response = await incrementService.updateIncrement(selectedItem._id, incrementData);
          console.log('✅ Update response:', response);
          toast.success('Item updated successfully!');
        } else {
          console.log('➕ Creating new increment...');
          const response = await incrementService.createIncrement(incrementData);
          console.log('✅ Create response:', response);
          toast.success('Item created successfully!');
        }
        
        console.log('⏱️ Completed API request at:', new Date().toISOString());
        console.log('🔄 Refreshing backlog data...');
        
        // Refresh backlog data
        await fetchBacklogData(selectedProject);
        handleCloseDialog();
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        
        // More detailed logging of request error
        if (apiError.response) {
          console.error('Response status:', apiError.response.status);
          console.error('Response data:', apiError.response.data);
          console.error('Response headers:', apiError.response.headers);
        } else if (apiError.request) {
          console.error('No response received:', apiError.request);
        } else {
          console.error('Request setup error:', apiError.message);
        }
        
        toast.error(`Failed to ${selectedItem ? 'update' : 'create'} item: ${apiError.message}`);
      }
    } catch (error) {
      console.error('❌ Error in submit handler:', error);
      
      // Add more detailed error logging
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      
      toast.error(`Failed to ${selectedItem ? 'update' : 'create'} item: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      await incrementService.deleteIncrement(id);
      toast.success('Item deleted successfully!');
      fetchBacklogData(selectedProject);
    } catch (error) {
      console.error('Error deleting increment:', error);
      toast.error(`Failed to delete item: ${error.message}`);
    }
  };

  const handleSprintAssignment = async (incrementId, sprintId, action = 'add') => {
    try {
      await incrementService.updateIncrementSprint(incrementId, sprintId, action);
      toast.success(`Item ${action === 'add' ? 'added to' : 'removed from'} sprint successfully!`);
      fetchBacklogData(selectedProject);
    } catch (error) {
      console.error('Error updating sprint assignment:', error);
      toast.error(`Failed to update sprint assignment: ${error.message}`);
    }
  };

  // Helper to normalize sprint statuses for UI display
  const normalizeSprintStatus = (status) => {
    if (!status) return 'Unknown';
    
    const normalized = status.toUpperCase();
    if (normalized === 'IN_PROGRESS' || normalized === 'ACTIVE') {
      return 'Active';
    } else if (normalized === 'PLANNING') {
      return 'Planning';
    } else if (normalized === 'COMPLETED') {
      return 'Completed';
    } else {
      return status; // Return original if no mapping
    }
  };
  
  // Helper to check if a sprint is active/in planning and should be available for selection
  const isSelectableSprint = (sprint) => {
    if (!sprint || !sprint.status) return true; // Include sprints even if they have no status
    
    const status = sprint.status.toUpperCase();
    // Accept almost any status except explicitly COMPLETED or CANCELLED
    return status !== 'COMPLETED' && status !== 'CANCELLED';
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

  const getIncrementTypeIcon = (type) => {
    if (!type) return <AssignmentIcon fontSize="small" />;
    
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'story':
        return <AssignmentIcon fontSize="small" color="primary" />;
      case 'task':
        return <TaskIcon fontSize="small" color="success" />;
      case 'defect':
      case 'bug':
        return <BugIcon fontSize="small" color="error" />;
      default:
        return <AssignmentIcon fontSize="small" />;
    }
  };

  const renderDialogContent = () => {
    return (
      <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            name="incrementType"
            value={formData.incrementType}
            onChange={handleInputChange}
            label="Type"
          >
            <MenuItem value="story">Story</MenuItem>
            <MenuItem value="task">Task</MenuItem>
            <MenuItem value="defect">Defect</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Title"
          name="title"
          fullWidth
          required
          value={formData.title}
          onChange={handleInputChange}
          error={formErrors.title}
          helperText={formErrors.title ? "Title is required" : ""}
        />
        
        <TextField
          label="Description"
          name="description"
          fullWidth
          multiline
          rows={3}
          value={formData.description}
          onChange={handleInputChange}
        />
        
        <FormControl fullWidth error={formErrors.project}>
          <InputLabel>Project</InputLabel>
          <Select
            name="project"
            value={formData.project}
            onChange={handleInputChange}
            label="Project"
            required
          >
            {projects.map(project => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
          {formErrors.project && <FormHelperText>Project is required</FormHelperText>}
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Sprint</InputLabel>
          <Select
            name="sprint"
            value={formData.sprint}
            onChange={handleInputChange}
            label="Sprint"
          >
            <MenuItem value="">None</MenuItem>
            {console.log('Sprint Dropdown Options:', sprintsForDropdown.length)}
            {sprintsForDropdown
              .filter(sprint => isSelectableSprint(sprint))
              .map(sprint => {
                console.log(`Adding sprint to dropdown: ${sprint.name}, Status: ${sprint.status}`);
                return (
                  <MenuItem key={sprint._id} value={sprint._id}>
                    {sprint.name} ({normalizeSprintStatus(sprint.status)})
                  </MenuItem>
                );
              })
            }
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            label="Status"
          >
            <MenuItem value="Backlog">Backlog</MenuItem>
            <MenuItem value="To Do">To Do</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="In Review">In Review</MenuItem>
            <MenuItem value="Done">Done</MenuItem>
            <MenuItem value="Blocked">Blocked</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            label="Priority"
          >
            <MenuItem value="Highest">Highest</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Lowest">Lowest</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Assigned To</InputLabel>
          <Select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleInputChange}
            label="Assigned To"
          >
            <MenuItem value="">Unassigned</MenuItem>
            {users.map(user => (
              <MenuItem key={user._id} value={user._id}>
                {user.firstName} {user.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {(formData.incrementType === 'story') && (
          <TextField
            label="Story Points"
            name="storyPoints"
            type="number"
            fullWidth
            value={formData.storyPoints}
            onChange={handleInputChange}
          />
        )}
        
        {(formData.incrementType === 'task') && (
          <TextField
            label="Estimated Hours"
            name="estimatedHours"
            type="number"
            fullWidth
            value={formData.estimatedHours}
            onChange={handleInputChange}
          />
        )}
        
        {(formData.incrementType === 'defect') && (
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
              label="Severity"
            >
              <MenuItem value="Critical">Critical</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>
    );
  };

  const renderBacklogItems = (items) => {
    if (!items || items.length === 0) {
      return (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography align="center" color="textSecondary">
            No items found
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  {getIncrementTypeIcon(item.incrementType || item.type)}
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {item.incrementType || item.type || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    size="small"
                    color={getStatusColor(item.status)}
                  />
                </TableCell>
                <TableCell>{item.priority}</TableCell>
                <TableCell>
                  {item.assignedTo ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ width: 24, height: 24, mr: 1 }}
                        alt={`${item.assignedTo.firstName} ${item.assignedTo.lastName}`}
                      >
                        {item.assignedTo.firstName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {item.assignedTo.firstName} {item.assignedTo.lastName}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {(item.incrementType === 'story' || item.type === 'story') && item.storyPoints && (
                    <Chip 
                      label={`${item.storyPoints} pts`} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {(item.incrementType === 'task' || item.type === 'task') && item.estimatedHours && (
                    <Chip 
                      label={`${item.estimatedHours} hrs`} 
                      size="small" 
                      color="success"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {(item.incrementType === 'defect' || item.type === 'defect') && (item.severity || item.priority) && (
                    <Chip 
                      label={item.severity || item.priority} 
                      size="small" 
                      color="error"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(item.incrementType || item.type, item)}
                    title="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item._id)}
                    title="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSprintSection = (sprint) => {
    console.log('Rendering sprint section for:', sprint);
    console.log('Sprint increments:', sprint.increments);
    
    return (
      <Card key={sprint._id} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{sprint.name}</Typography>
            <Box>
              <Chip 
                label={normalizeSprintStatus(sprint.status)} 
                color={isSelectableSprint(sprint) ? 'success' : 'default'}
                size="small"
                sx={{ mr: 1 }}
              />
              {sprint.startDate && sprint.endDate && (
                <Chip 
                  label={`${format(new Date(sprint.startDate), 'MMM dd')} - ${format(new Date(sprint.endDate), 'MMM dd')}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          
          {Array.isArray(sprint.increments) ? (
            renderBacklogItems(sprint.increments)
          ) : (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography align="center" color="textSecondary">
                No increments found in this sprint
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h4">Backlog</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={handleProjectChange}
                label="Project"
                size="small"
              >
                {projects.map(project => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('story')}
            >
              Add Item
            </Button>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Backlog Items</Typography>
        {renderBacklogItems(backlogData.backlogItems)}

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Sprints</Typography>
        {backlogData.sprints && backlogData.sprints.length > 0 ? (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Found {backlogData.sprints.length} sprints ({backlogData.sprints.filter(s => isSelectableSprint(s)).length} active)
              </Typography>
            </Box>
            {/* Sort sprints - active/in progress first, then planning, then others */}
            {backlogData.sprints
              .sort((a, b) => {
                // Define status priorities for sorting
                const getPriority = (status) => {
                  if (!status) return 99;
                  const s = status.toUpperCase();
                  if (s === 'IN_PROGRESS' || s === 'ACTIVE') return 0;
                  if (s === 'PLANNING') return 1;
                  if (s === 'IN_REVIEW') return 2;
                  if (s === 'COMPLETED') return 3;
                  return 99; // Unknown status at the end
                };
                
                return getPriority(a.status) - getPriority(b.status);
              })
              .map(sprint => {
                console.log(`Preparing to render sprint ${sprint.name} with status ${sprint.status} and ${sprint.increments?.length || 0} increments`);
                return renderSprintSection(sprint);
              })}
          </>
        ) : (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography align="center" color="textSecondary">
              No sprints found
            </Typography>
          </Paper>
        )}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown={isSubmitting}
          disableBackdropClick={isSubmitting}
        >
          <DialogTitle>
            {selectedItem ? 'Edit' : 'Create'} Item
          </DialogTitle>
          <DialogContent>
            {renderDialogContent()}
          </DialogContent>
          <DialogActions>
            <Button 
              id="cancel-button" 
              type="button" 
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              id="submit-button" 
              type="button" 
              variant="contained" 
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  {selectedItem ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                selectedItem ? 'Update' : 'Create'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Backlog; 