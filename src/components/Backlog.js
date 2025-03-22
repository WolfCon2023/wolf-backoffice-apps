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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  BugReport as BugIcon,
  Task as TaskIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import storyService from '../services/storyService';
import taskService from '../services/taskService';
import defectService from '../services/defectService';
import { projectService } from '../services/projectService';
import sprintService from '../services/sprintService';

const Backlog = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [defects, setDefects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('story');
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    status: '',
    projectId: '',
    sprintId: '',
    assignee: '',
    storyPoints: '',
    type: '',
    estimatedHours: '',
    severity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, sprintsData, storiesData, tasksData, defectsData] = await Promise.all([
        projectService.getAllProjects(),
        sprintService.getAllSprints(),
        storyService.getAllStories(),
        taskService.getAllTasks(),
        defectService.getAllDefects(),
      ]);

      setProjects(projectsData);
      setSprints(sprintsData);
      setStories(storiesData);
      setTasks(tasksData);
      setDefects(defectsData);
    } catch (error) {
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
        storyPoints: '',
        type: '',
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
      let response;
      
      if (dialogType === 'story') {
        if (selectedItem) {
          response = await storyService.updateStory(selectedItem.id, formData);
          setStories(stories.map(s => s.id === selectedItem.id ? response : s));
        } else {
          response = await storyService.createStory(formData);
          setStories([...stories, response]);
        }
      } else if (dialogType === 'task') {
        if (selectedItem) {
          response = await taskService.updateTask(selectedItem.id, formData);
          setTasks(tasks.map(t => t.id === selectedItem.id ? response : t));
        } else {
          response = await taskService.createTask(formData);
          setTasks([...tasks, response]);
        }
      } else if (dialogType === 'defect') {
        if (selectedItem) {
          response = await defectService.updateDefect(selectedItem.id, formData);
          setDefects(defects.map(d => d.id === selectedItem.id ? response : d));
        } else {
          response = await defectService.createDefect(formData);
          setDefects([...defects, response]);
        }
      }

      toast.success(`${dialogType} ${selectedItem ? 'updated' : 'created'} successfully!`);
      handleCloseDialog();
    } catch (error) {
      toast.error(`Failed to ${selectedItem ? 'update' : 'create'} ${dialogType}`);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'story') {
        await storyService.deleteStory(id);
        setStories(stories.filter(s => s.id !== id));
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
    return (
      <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            name="projectId"
            value={formData.projectId}
            onChange={handleInputChange}
            label="Project"
          >
            {projects.map(project => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Sprint</InputLabel>
          <Select
            name="sprintId"
            value={formData.sprintId}
            onChange={handleInputChange}
            label="Sprint"
          >
            {sprints.map(sprint => (
              <MenuItem key={sprint.id} value={sprint.id}>
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
        {dialogType === 'story' && (
          <>
            <FormControl fullWidth>
              <InputLabel>Story Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                label="Story Type"
              >
                <MenuItem value="Feature">Feature</MenuItem>
                <MenuItem value="Enhancement">Enhancement</MenuItem>
                <MenuItem value="Bug">Bug</MenuItem>
                <MenuItem value="Spike">Spike</MenuItem>
                <MenuItem value="Chore">Chore</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Story Points"
              name="storyPoints"
              type="number"
              fullWidth
              value={formData.storyPoints}
              onChange={handleInputChange}
            />
          </>
        )}
        {dialogType === 'task' && (
          <TextField
            label="Estimated Hours"
            name="estimatedHours"
            type="number"
            fullWidth
            value={formData.estimatedHours}
            onChange={handleInputChange}
          />
        )}
        {dialogType === 'defect' && (
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

  const renderTable = (type) => {
    let data = [];
    let columns = [];

    if (type === 'story') {
      data = stories;
      columns = [
        { id: 'id', label: 'ID' },
        { id: 'title', label: 'Title' },
        { id: 'type', label: 'Type' },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' },
        { id: 'storyPoints', label: 'Points' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'task') {
      data = tasks;
      columns = [
        { id: 'id', label: 'ID' },
        { id: 'title', label: 'Title' },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' },
        { id: 'estimatedHours', label: 'Est. Hours' },
        { id: 'actions', label: 'Actions' },
      ];
    } else if (type === 'defect') {
      data = defects;
      columns = [
        { id: 'id', label: 'ID' },
        { id: 'title', label: 'Title' },
        { id: 'status', label: 'Status' },
        { id: 'severity', label: 'Severity' },
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
                <TableRow key={item.id}>
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
                            onClick={() => handleDelete(type, item.id)}
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
              activeTab === 0 ? 'story' : activeTab === 1 ? 'task' : 'defect'
            )}
          >
            New {activeTab === 0 ? 'Story' : activeTab === 1 ? 'Task' : 'Defect'}
          </Button>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab
            icon={<AssignmentIcon />}
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

        {activeTab === 0 && renderTable('story')}
        {activeTab === 1 && renderTable('task')}
        {activeTab === 2 && renderTable('defect')}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedItem ? 'Edit' : 'Create'} {dialogType}
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