import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { storyService } from '../services/storyService';
import { projectService } from '../services/projectService';
import featureService from '../services/featureService';
import taskService from '../services/taskService';
import defectService from '../services/defectService';

const StoryType = {
  STORY: 'Feature',
  TASK: 'Task',
  BUG: 'Bug',
  EPIC: 'Epic'
};

const StoryStatus = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold'
};

const Priority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

const Backlog = () => {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [features, setFeatures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: StoryType.STORY,
    project: '',
    feature: '',
    effortPoints: 0,
    priority: Priority.MEDIUM,
    status: StoryStatus.PLANNING
  });

  useEffect(() => {
    fetchData();
  }, []);

  const mapTaskToStory = (task) => ({
    _id: task._id,
    title: task.taskName,
    description: task.taskDescription,
    type: StoryType.TASK,
    project: task.projectId,
    status: task.status.toUpperCase(),
    priority: task.priority,
    storyPoints: task.progress || 0,
    assignee: task.assignee,
    deadline: task.deadline
  });

  const mapDefectToStory = (defect) => ({
    _id: defect._id,
    title: defect.title,
    description: defect.description,
    type: StoryType.BUG,
    project: defect.projectId,
    status: defect.status.toUpperCase(),
    priority: defect.severity,
    reportedBy: defect.reportedBy,
    dateReported: defect.dateReported
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [projectsData, featuresData, storiesData, tasksData, defectsData] = await Promise.all([
        projectService.getAllProjects(),
        featureService.getAllFeatures(),
        storyService.getAllStories(),
        taskService.getAllTasks(),
        defectService.getAllDefects()
      ]);

      // Map tasks and defects to story format
      const mappedTasks = tasksData.map(mapTaskToStory);
      const mappedDefects = defectsData.map(mapDefectToStory);

      // Combine all items
      const allStories = [
        ...storiesData,
        ...mappedTasks,
        ...mappedDefects
      ];

      setProjects(projectsData);
      setFeatures(featuresData);
      setStories(allStories);

      console.log('Fetched data:', {
        projects: projectsData.length,
        features: featuresData.length,
        stories: storiesData.length,
        tasks: tasksData.length,
        defects: defectsData.length,
        total: allStories.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please try again later.');
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
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
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: StoryType.STORY,
      project: '',
      feature: '',
      effortPoints: 0,
      priority: Priority.MEDIUM,
      status: StoryStatus.PLANNING
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

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.project) {
        setError('Title and Project are required');
        return;
      }

      const storyData = {
        ...formData,
        storyPoints: parseInt(formData.effortPoints) || 0
      };

      console.log('Creating story with data:', storyData);
      
      if (selectedItem) {
        // Handle updates based on type
        if (storyData.type === StoryType.TASK) {
          const taskData = {
            taskName: storyData.title,
            taskDescription: storyData.description,
            priority: storyData.priority,
            status: storyData.status,
            projectId: storyData.project,
            progress: storyData.storyPoints
          };
          await taskService.updateTask(selectedItem._id, taskData);
        } else if (storyData.type === StoryType.BUG) {
          const defectData = {
            title: storyData.title,
            description: storyData.description,
            severity: storyData.priority,
            status: storyData.status,
            projectId: storyData.project
          };
          await defectService.updateDefect(selectedItem._id, defectData);
        } else {
          await storyService.updateStory(selectedItem._id, storyData);
        }
        toast.success('Item updated successfully');
      } else {
        // Handle creation based on type
        if (storyData.type === StoryType.TASK) {
          const taskData = {
            taskName: storyData.title,
            taskDescription: storyData.description,
            priority: storyData.priority,
            status: storyData.status,
            projectId: storyData.project,
            progress: storyData.storyPoints,
            category: 'Development'
          };
          await taskService.createTask(taskData);
        } else if (storyData.type === StoryType.BUG) {
          const defectData = {
            title: storyData.title,
            description: storyData.description,
            severity: storyData.priority,
            status: storyData.status,
            projectId: storyData.project
          };
          await defectService.createDefect(defectData);
        } else {
          await storyService.createStory(storyData);
        }
        toast.success('Item created successfully');
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'An error occurred while saving');
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async (id, type) => {
    try {
      if (type === StoryType.TASK) {
        await taskService.deleteTask(id);
      } else if (type === StoryType.BUG) {
        await defectService.deleteDefect(id);
      } else {
        await storyService.deleteStory(id);
      }
      toast.success('Item deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PLANNING':
        return 'info';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'default';
      case 'ON_HOLD':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case StoryType.STORY:
        return '📝';
      case StoryType.TASK:
        return '✅';
      case StoryType.BUG:
        return '🐛';
      case StoryType.EPIC:
        return '🚀';
      default:
        return '📋';
    }
  };

  const renderForm = () => {
    return (
      <Box component="form" noValidate autoComplete="off">
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Type</InputLabel>
          <Select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
          >
            <MenuItem value={StoryType.STORY}>Story</MenuItem>
            <MenuItem value={StoryType.TASK}>Task</MenuItem>
            <MenuItem value={StoryType.BUG}>Bug</MenuItem>
            <MenuItem value={StoryType.EPIC}>Epic</MenuItem>
          </Select>
        </FormControl>

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
          <InputLabel>Parent Feature</InputLabel>
          <Select
            name="feature"
            value={formData.feature}
            onChange={handleInputChange}
            disabled={!formData.project}
          >
            <MenuItem value="">None</MenuItem>
            {features
              .filter(feature => feature.project === formData.project)
              .map((feature) => (
                <MenuItem key={feature._id} value={feature._id}>
                  {feature.name}
                </MenuItem>
            ))}
          </Select>
          <FormHelperText>Select a project first to see available features</FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
          >
            <MenuItem value={Priority.LOW}>Low</MenuItem>
            <MenuItem value={Priority.MEDIUM}>Medium</MenuItem>
            <MenuItem value={Priority.HIGH}>High</MenuItem>
            <MenuItem value={Priority.CRITICAL}>Critical</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <MenuItem value={StoryStatus.PLANNING}>Planning</MenuItem>
            <MenuItem value={StoryStatus.IN_PROGRESS}>In Progress</MenuItem>
            <MenuItem value={StoryStatus.COMPLETED}>Completed</MenuItem>
            <MenuItem value={StoryStatus.CANCELLED}>Cancelled</MenuItem>
            <MenuItem value={StoryStatus.ON_HOLD}>On Hold</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          margin="normal"
          name="effortPoints"
          label="Story Points"
          type="number"
          value={formData.effortPoints}
          onChange={handleInputChange}
          InputProps={{ inputProps: { min: 0 } }}
        />

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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Story' : 'Create Story'}
        </DialogTitle>
        <DialogContent>
          {renderForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderStories = () => {
    const columns = [
      { id: 'type', label: 'Type', width: '5%' },
      { id: 'title', label: 'Title', width: '25%' },
      { id: 'feature', label: 'Feature', width: '15%' },
      { id: 'project', label: 'Project', width: '15%' },
      { id: 'status', label: 'Status', width: '10%' },
      { id: 'priority', label: 'Priority', width: '10%' },
      { id: 'points', label: 'Points', width: '10%' },
      { id: 'actions', label: 'Actions', width: '10%' },
    ];

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} style={{ width: column.width }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stories.map((story) => (
              <TableRow key={story._id}>
                <TableCell>
                  <Typography>{getTypeIcon(story.type)}</Typography>
                </TableCell>
                <TableCell>{story.title}</TableCell>
                <TableCell>
                  {features.find(f => f._id === story.feature)?.name || '-'}
                </TableCell>
                <TableCell>
                  {projects.find(p => p._id === story.project)?.name || '-'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={story.status} 
                    color={getStatusColor(story.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={story.priority}
                    color={story.priority === Priority.CRITICAL ? 'error' : 
                           story.priority === Priority.HIGH ? 'warning' :
                           story.priority === Priority.MEDIUM ? 'info' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{story.storyPoints || 0}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(story)}
                    title="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(story._id, story.type)}
                    title="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {stories.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No stories found
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
            onClick={() => handleOpenDialog()}
          >
            Create Story
          </Button>
        </Box>

        {renderStories()}
        {renderDialog()}
      </Box>
    </Container>
  );
};

export default Backlog; 