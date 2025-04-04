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
import { storyService, StoryStatus } from '../services/storyService';
import { projectService } from '../services/projectService';
import featureService from '../services/featureService';
import taskService from '../services/taskService';
import defectService from '../services/defectService';
import { sprintService } from '../services/sprintService';

const StoryType = {
  STORY: 'Story',
  TASK: 'Task',
  DEFECT: 'Defect'
};

const Priority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

const normalizeStatus = (status) => {
  if (!status) return StoryStatus.PLANNING;
  return status.toUpperCase().replace(/\s+/g, '_');
};

const Backlog = () => {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [features, setFeatures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: StoryType.STORY,
    status: StoryStatus.PLANNING,
    priority: Priority.MEDIUM,
    project: '',
    sprint: '',
    feature: '',
    effortPoints: 0,
    assignee: '',
    reporter: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const mapTaskToStory = (task) => ({
    _id: task._id,
    title: task.taskName,
    description: task.taskDescription,
    type: StoryType.TASK,
    key: task.key,
    project: task.project,
    status: normalizeStatus(task.status),
    priority: task.priority,
    storyPoints: task.progress || 0,
    assignee: task.assignee,
    deadline: task.deadline,
    taskNumber: task.taskNumber
  });

  const mapDefectToStory = (defect) => ({
    _id: defect._id,
    title: defect.title,
    description: defect.description,
    type: StoryType.DEFECT,
    key: defect.key,
    project: defect.projectId,
    status: normalizeStatus(defect.status),
    priority: defect.severity,
    reportedBy: defect.reportedBy,
    dateReported: defect.dateReported,
    defectNumber: defect.defectNumber
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching all data...');
      
      // Fetch all data in parallel
      const [projectsData, sprintsData, featuresData, storiesData, tasksData, defectsData] = await Promise.all([
        projectService.getAllProjects(),
        sprintService.getAllSprints(),
        featureService.getAllFeatures(),
        storyService.getAllStories(),
        taskService.getAllTasks(),
        defectService.getAllDefects()
      ]);

      console.log('✅ Data fetched:', {
        projects: projectsData?.length,
        sprints: sprintsData?.length,
        features: featuresData?.length,
        stories: storiesData?.length,
        tasks: tasksData?.length,
        defects: defectsData?.length
      });

      // Set raw data without normalization
      setProjects(projectsData || []);
      setSprints(sprintsData || []);
      setFeatures(featuresData || []);

      // Keep each type separate but in the same array for display
      const allIncrements = [
        ...(storiesData || []),
        ...(tasksData || []),
        ...(defectsData || [])
      ];

      setStories(allIncrements);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    setSelectedItem(item);
    if (item) {
      setFormData({
        title: item.title || item.taskName || '',
        description: item.description || item.taskDescription || '',
        type: item.type || StoryType.STORY,
        status: normalizeStatus(item.status),
        priority: item.priority || item.severity || Priority.MEDIUM,
        project: item.project || item.projectId || '',
        sprint: item.sprint?._id || item.sprintId || '',
        feature: item.feature?._id || '',
        effortPoints: item.storyPoints || item.progress || 0,
        assignee: item.assignee || '',
        reporter: item.reporter || ''
      });
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
      status: StoryStatus.PLANNING,
      priority: Priority.MEDIUM,
      project: '',
      sprint: '',
      feature: '',
      effortPoints: 0,
      assignee: '',
      reporter: ''
    });
    setError('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    
    // Special handling for status to ensure correct format
    if (name === 'status') {
      setFormData(prev => ({
        ...prev,
        [name]: normalizeStatus(value)
      }));
      return;
    }

    // For sprint and feature, ensure we store just the ID
    if (name === 'sprint' || name === 'feature') {
      setFormData(prev => ({
        ...prev,
        [name]: value || '' // Store empty string if value is null/undefined
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    setFormData(prev => ({
      ...prev,
      project: projectId,
      sprint: '',  // Reset sprint when project changes
      feature: ''  // Reset feature when project changes
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let result;

      // Validate required fields
      if (!formData.title || !formData.project || !formData.type) {
        toast.error('Title, project and type are required');
        return;
      }

      // Get current user ID for reporter field
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      const reporterId = currentUser._id;

      if (!reporterId) {
        toast.error('No user found. Please log in again.');
        return;
      }

      if (selectedItem) {
        // Update existing item
        switch (formData.type) {
          case StoryType.STORY:
            result = await storyService.updateStory(selectedItem._id, {
              title: formData.title,
              description: formData.description,
              status: formData.status,
              priority: formData.priority,
              project: formData.project,
              reporter: reporterId,
              storyPoints: formData.effortPoints,
              feature: formData.feature || null,
              assignee: formData.assignee,
              sprint: formData.sprint || null
            });
            break;
          case StoryType.TASK:
            result = await taskService.updateTask(selectedItem._id, {
              taskName: formData.title,
              taskDescription: formData.description,
              status: formData.status,
              priority: formData.priority,
              project: formData.project,
              reporter: reporterId,
              progress: formData.effortPoints,
              assignee: formData.assignee,
              deadline: formData.deadline,
              sprint: formData.sprint || null
            });
            break;
          case StoryType.DEFECT:
            result = await defectService.updateDefect(selectedItem._id, {
              title: formData.title,
              description: formData.description,
              status: formData.status,
              severity: formData.priority,
              project: formData.project,
              reportedBy: reporterId,
              sprint: formData.sprint || null
            });
            break;
        }
      } else {
        // Create new item
        switch (formData.type) {
          case StoryType.STORY:
            result = await storyService.createStory({
              title: formData.title,
              description: formData.description,
              status: formData.status,
              priority: formData.priority,
              project: formData.project,
              reporter: reporterId,
              storyPoints: formData.effortPoints,
              feature: formData.feature || null,
              assignee: formData.assignee,
              sprint: formData.sprint || null
            });
            break;
          case StoryType.TASK:
            result = await taskService.createTask({
              taskName: formData.title,
              taskDescription: formData.description,
              status: formData.status,
              priority: formData.priority,
              project: formData.project,
              reporter: reporterId,
              progress: formData.effortPoints,
              assignee: formData.assignee,
              deadline: formData.deadline,
              sprint: formData.sprint || null,
              category: 'Development'
            });
            break;
          case StoryType.DEFECT:
            result = await defectService.createDefect({
              title: formData.title,
              description: formData.description,
              status: formData.status,
              severity: formData.priority,
              project: formData.project,
              reportedBy: reporterId,
              sprint: formData.sprint || null,
              dateReported: new Date()
            });
            break;
        }
      }

      handleCloseDialog();
      await fetchData();
      toast.success(`${formData.type} ${selectedItem ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to ${selectedItem ? 'update' : 'create'} ${formData.type.toLowerCase()}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      if (type === StoryType.TASK) {
        await taskService.deleteTask(id);
      } else if (type === StoryType.DEFECT) {
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
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case StoryStatus.PLANNING:
        return 'info';
      case StoryStatus.IN_PROGRESS:
        return 'warning';
      case StoryStatus.COMPLETED:
        return 'success';
      case StoryStatus.CANCELLED:
        return 'default';
      case StoryStatus.ON_HOLD:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusDisplay = (status) => {
    const normalizedStatus = status?.replace(/_/g, ' ');
    return normalizedStatus?.charAt(0) + normalizedStatus?.slice(1)?.toLowerCase();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case StoryType.STORY:
        return '📝';
      case StoryType.TASK:
        return '✅';
      case StoryType.DEFECT:
        return '🐛';
      default:
        return '📋';
    }
  };

  const renderForm = () => {
    return (
      <Box component="form" noValidate autoComplete="off">
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Increment Type</InputLabel>
          <Select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
          >
            <MenuItem value={StoryType.STORY}>Story</MenuItem>
            <MenuItem value={StoryType.TASK}>Task</MenuItem>
            <MenuItem value={StoryType.DEFECT}>Defect</MenuItem>
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
            value={typeof formData.project === 'object' ? formData.project._id : formData.project}
            onChange={handleProjectChange}
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
            value={formData.sprint || ''}
            onChange={handleInputChange}
          >
            <MenuItem value="">None</MenuItem>
            {sprints.map((sprint) => (
              <MenuItem key={sprint._id} value={sprint._id}>
                {sprint.name || `Sprint ${sprint.number}`}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Select a sprint (optional)
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Feature</InputLabel>
          <Select
            name="feature"
            value={formData.feature || ''}
            onChange={handleInputChange}
            disabled={formData.type !== StoryType.STORY}
          >
            <MenuItem value="">None</MenuItem>
            {features
              .filter(feature => !formData.project || feature.project === formData.project)
              .map((feature) => (
                <MenuItem key={feature._id} value={feature._id}>
                  {feature.name}
                </MenuItem>
              ))}
          </Select>
          <FormHelperText>
            {formData.type !== StoryType.STORY
              ? 'Only Stories can be linked to Features'
              : 'Select a feature (optional)'}
          </FormHelperText>
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
            {Object.values(StoryStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusDisplay(status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          margin="normal"
          name="effortPoints"
          label="Increment Points"
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
          {selectedItem ? 'Edit Increment' : 'Create Increment'}
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
                    label={getStatusDisplay(story.status)}
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
                  No increments found
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
            Create Increment
          </Button>
        </Box>

        {renderStories()}
        {renderDialog()}
      </Box>
    </Container>
  );
};

export default Backlog; 