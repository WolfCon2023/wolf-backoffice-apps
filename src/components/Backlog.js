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
  Avatar
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
  const [activeTab, setActiveTab] = useState('all');
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBacklogData(selectedProject);
    }
  }, [selectedProject]);

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
      const data = await incrementService.getBacklogData(projectId);
      setBacklogData(data);
    } catch (error) {
      toast.error('Failed to fetch backlog data');
      console.error('Error fetching backlog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const currentUserId = userData?._id;
      
      if (!currentUserId) {
        toast.error('User information not found. Please login again.');
        return;
      }
      
      if (!formData.title) {
        toast.error('Title is required');
        return;
      }
      
      if (!formData.project) {
        toast.error('Project is required');
        return;
      }
      
      // Prepare data for API
      const incrementData = {
        ...formData,
        createdBy: currentUserId,
      };
      
      let response;
      
      if (selectedItem) {
        response = await incrementService.updateIncrement(selectedItem._id, incrementData);
        toast.success('Item updated successfully!');
      } else {
        response = await incrementService.createIncrement(incrementData);
        toast.success('Item created successfully!');
      }
      
      // Refresh backlog data
      fetchBacklogData(selectedProject);
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving increment:', error);
      toast.error(`Failed to ${selectedItem ? 'update' : 'create'} item: ${error.message}`);
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
    switch (type) {
      case 'story':
        return <AssignmentIcon fontSize="small" color="primary" />;
      case 'task':
        return <TaskIcon fontSize="small" color="success" />;
      case 'defect':
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
        
        <FormControl fullWidth>
          <InputLabel>Project</InputLabel>
          <Select
            name="project"
            value={formData.project}
            onChange={handleInputChange}
            label="Project"
          >
            {projects.map(project => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
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
            {backlogData.sprints.map(sprint => (
              <MenuItem key={sprint._id} value={sprint._id}>
                {sprint.name}
              </MenuItem>
            ))}
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

    // Filter items based on activeTab
    const filteredItems = activeTab === 'all' 
      ? items 
      : items.filter(item => item.incrementType === activeTab);
    
    if (filteredItems.length === 0) {
      return (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography align="center" color="textSecondary">
            No {activeTab} items found
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
            {filteredItems.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  {getIncrementTypeIcon(item.incrementType)}
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {item.incrementType}
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
                  {item.incrementType === 'story' && item.storyPoints && (
                    <Chip 
                      label={`${item.storyPoints} pts`} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {item.incrementType === 'task' && item.estimatedHours && (
                    <Chip 
                      label={`${item.estimatedHours} hrs`} 
                      size="small" 
                      color="success"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {item.incrementType === 'defect' && item.severity && (
                    <Chip 
                      label={item.severity} 
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
                    onClick={() => handleOpenDialog(item.incrementType, item)}
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
    return (
      <Card key={sprint._id} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{sprint.name}</Typography>
            <Box>
              <Chip 
                label={sprint.status} 
                color={sprint.status === 'Active' ? 'success' : 'default'}
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
          
          {renderBacklogItems(sprint.increments)}
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

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab
            value="all"
            icon={<Badge badgeContent={backlogData.backlogItems?.length || 0} color="primary">
              <DragIcon />
            </Badge>}
            label="All Items"
            iconPosition="start"
          />
          <Tab
            value="story"
            icon={<Badge 
              badgeContent={
                backlogData.backlogItems?.filter(item => item.incrementType === 'story').length || 0
              } 
              color="primary"
            >
              <AssignmentIcon />
            </Badge>}
            label="Stories"
            iconPosition="start"
          />
          <Tab
            value="task"
            icon={<Badge 
              badgeContent={
                backlogData.backlogItems?.filter(item => item.incrementType === 'task').length || 0
              } 
              color="success"
            >
              <TaskIcon />
            </Badge>}
            label="Tasks"
            iconPosition="start"
          />
          <Tab
            value="defect"
            icon={<Badge 
              badgeContent={
                backlogData.backlogItems?.filter(item => item.incrementType === 'defect').length || 0
              } 
              color="error"
            >
              <BugIcon />
            </Badge>}
            label="Defects"
            iconPosition="start"
          />
        </Tabs>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Backlog Items</Typography>
        {renderBacklogItems(backlogData.backlogItems)}

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Sprints</Typography>
        {backlogData.sprints && backlogData.sprints.length > 0 ? (
          backlogData.sprints.map(sprint => renderSprintSection(sprint))
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
        >
          <DialogTitle>
            {selectedItem ? 'Edit' : 'Create'} Item
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