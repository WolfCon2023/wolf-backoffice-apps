import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Import services
import teamService from '../services/teamService';
import { projectService } from '../services/projectService';
import sprintService from '../services/sprintService';
import { storyService } from '../services/storyService';
import taskService, { TaskStatus, TaskPriority } from '../services/taskService';
import defectService, { DefectStatus, DefectSeverity } from '../services/defectService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stratflow-tabpanel-${index}`}
      aria-labelledby={`stratflow-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StratFlowAdmin = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Data states
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [stories, setStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [defects, setDefects] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Dialog states
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    item: null,
    type: '',
    newStatus: ''
  });

  // State for tracking the selected status separately
  const [selectedStatus, setSelectedStatus] = useState('');

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    item: null,
    type: '',
    confirmation: ''
  });

  useEffect(() => {
    // Fetch data based on current tab
    fetchData();
  }, [currentTab, refreshTrigger]);

  useEffect(() => {
    if (statusDialog.item) {
      setSelectedStatus(statusDialog.item.status || '');
    }
  }, [statusDialog.item]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (currentTab) {
        case 0: // Teams
          const teamsData = await teamService.getAllTeams();
          setTeams(teamsData);
          break;
        case 1: // Projects
          const projectsData = await projectService.getAllProjects();
          setProjects(projectsData);
          break;
        case 2: // Sprints
          const sprintsData = await sprintService.getAllSprints();
          setSprints(sprintsData);
          break;
        case 3: // Stories
          const storiesData = await storyService.getAllStories();
          setStories(storiesData);
          break;
        case 4: // Tasks
          const tasksData = await taskService.getAllTasks();
          setTasks(tasksData);
          break;
        case 5: // Defects
          const defectsData = await defectService.getAllDefects();
          setDefects(defectsData);
          break;
        case 6: // Users
          const usersData = await teamService.getAllUsers();
          setUsers(usersData);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatStatus = (status, type = '') => {
    if (!status) return 'Unknown';
    
    const normalizedStatus = status.toUpperCase();
    
    if (type === 'sprint') {
      const formattedStatus = {
        'PLANNING': 'Planning',
        'IN_PROGRESS': 'In Progress',
        'COMPLETED': 'Completed',
        'CANCELLED': 'Cancelled'
      }[normalizedStatus] || status;
      
      return formattedStatus;
    }
    
    const formattedStatus = {
      'ACTIVE': 'Active',
      'ON_HOLD': 'On Hold',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    }[normalizedStatus] || status;
    
    return formattedStatus;
  };

  const getStatusColor = (status, type = '') => {
    if (!status) return 'default';
    
    const normalizedStatus = status.toUpperCase();
    
    if (type === 'sprint') {
      return {
        'PLANNING': 'info',
        'IN_PROGRESS': 'success',
        'COMPLETED': 'default',
        'CANCELLED': 'error'
      }[normalizedStatus] || 'default';
    }
    
    return {
      'ACTIVE': 'success',
      'ON_HOLD': 'warning',
      'COMPLETED': 'info',
      'CANCELLED': 'error'
    }[normalizedStatus] || 'default';
  };

  // Get status options based on type
  const getStatusOptions = (type) => {
    switch (type) {
      case 'task':
        return Object.values(TaskStatus);
      case 'defect':
        return Object.values(DefectStatus);
      case 'sprint':
        return ['Planning', 'In Progress', 'Completed', 'Cancelled'];
      default:
        return ['Active', 'On Hold', 'Completed', 'Cancelled'];
    }
  };

  // Open status change dialog
  const openStatusDialog = (item, type) => {
    console.log('Opening status dialog with item:', item);
    console.log('Dialog type:', type);
    console.log('Current item status:', item.status);
    
    const initialStatus = item.status || '';
    console.log('Setting initial status:', initialStatus);
    
    setSelectedStatus(initialStatus);
    setStatusDialog({
      open: true,
      item,
      type,
      newStatus: initialStatus
    });
  };

  // Handle status change
  const handleStatusChange = (event) => {
    const value = event.target.value;
    console.log('Status select onChange triggered');
    console.log('Previous status:', selectedStatus);
    console.log('New selected status:', value);
    
    setSelectedStatus(value);
    setStatusDialog(prev => ({
      ...prev,
      newStatus: value
    }));
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (item, type) => {
    setDeleteDialog({
      open: true,
      item,
      type,
      confirmation: ''
    });
  };

  // Update status
  const handleStatusUpdate = async () => {
    const { item, type } = statusDialog;
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    
    setLoading(true);
    
    try {
      let result;
      
      switch (type) {
        case 'team':
          result = await teamService.updateTeamStatus(item._id, selectedStatus);
          break;
        case 'project':
          result = await projectService.updateProjectStatus(item._id, selectedStatus);
          break;
        case 'sprint':
          result = await sprintService.updateSprintStatus(item._id, selectedStatus);
          break;
        case 'story':
          result = await storyService.updateStoryStatus(item._id, selectedStatus);
          break;
        case 'task':
          result = await taskService.updateTaskStatus(item.id, selectedStatus);
          break;
        case 'defect':
          result = await defectService.updateDefectStatus(item.id, selectedStatus);
          break;
        default:
          throw new Error('Unknown item type');
      }
      
      toast.success(`Status updated to ${formatStatus(selectedStatus, type)}`);
      setStatusDialog({ open: false, item: null, type: '', newStatus: '' });
      setSelectedStatus('');
      refreshData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDelete = async () => {
    const { item, type, confirmation } = deleteDialog;
    
    // Check confirmation
    if (confirmation !== `delete ${item.name || item.title || item.taskName || item._id}`) {
      toast.error('Confirmation text does not match');
      return;
    }
    
    setLoading(true);
    
    try {
      switch (type) {
        case 'team':
          await teamService.deleteTeam(item._id);
          break;
        case 'project':
          await projectService.deleteProject(item._id);
          break;
        case 'sprint':
          await sprintService.deleteSprint(item._id);
          break;
        case 'story':
          await storyService.deleteStory(item._id);
          break;
        case 'task':
          await taskService.deleteTask(item.id);
          break;
        case 'defect':
          await defectService.deleteDefect(item.id);
          break;
        default:
          throw new Error('Unknown item type');
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      setDeleteDialog({ open: false, item: null, type: '', confirmation: '' });
      refreshData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            StratFlow Admin Tool
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                try {
                  // Get the first project
                  const project = projects[0];
                  if (!project) {
                    toast.error('Please create a project first');
                    return;
                  }
                  console.log('Selected project for test data:', project);

                  // Fetch users if not already loaded
                  let user;
                  if (users.length === 0) {
                    const fetchedUsers = await teamService.getAllUsers();
                    setUsers(fetchedUsers);
                    user = fetchedUsers[0];
                  } else {
                    user = users[0];
                  }

                  if (!user) {
                    toast.error('Please create a user first');
                    return;
                  }
                  console.log('Selected user for test data:', user);

                  // Create test task
                  console.log('Creating test task...');
                  const taskResult = await taskService.createTestTask(project._id, user._id);
                  console.log('Created test task:', taskResult);
                  
                  // Create test defect
                  console.log('Creating test defect...');
                  const defectResult = await defectService.createTestDefect(project._id, user._id);
                  console.log('Created test defect:', defectResult);
                  
                  toast.success('Created test task and defect');
                  refreshData();
                } catch (error) {
                  console.error('Error creating test data:', error);
                  toast.error(`Failed to create test data: ${error.message}`);
                }
              }}
            >
              Create Test Data
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="StratFlow admin tabs">
              <Tab label="Teams" />
              <Tab label="Projects" />
              <Tab label="Sprints" />
              <Tab label="Stories" />
              <Tab label="Tasks" />
              <Tab label="Defects" />
            </Tabs>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Teams Tab */}
              <TabPanel value={currentTab} index={0}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Members</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">No teams found</TableCell>
                        </TableRow>
                      ) : (
                        teams.map(team => (
                          <TableRow key={team._id}>
                            <TableCell>{team.name}</TableCell>
                            <TableCell>
                              <Chip 
                                label={formatStatus(team.status)} 
                                color={getStatusColor(team.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{team.members?.length || 0}</TableCell>
                            <TableCell>
                              {new Date(team.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/teams/${team._id}`)}
                                title="View/Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openStatusDialog(team, 'team')}
                                title="Change Status"
                              >
                                <ToggleOnIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openDeleteDialog(team, 'team')}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              {/* Projects Tab */}
              <TabPanel value={currentTab} index={1}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">No projects found</TableCell>
                        </TableRow>
                      ) : (
                        projects.map(project => (
                          <TableRow key={project._id}>
                            <TableCell>{project.name}</TableCell>
                            <TableCell>{project.key}</TableCell>
                            <TableCell>
                              <Chip 
                                label={formatStatus(project.status)} 
                                color={getStatusColor(project.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{project.team?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/projects/${project._id}`)}
                                title="View/Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openStatusDialog(project, 'project')}
                                title="Change Status"
                              >
                                <ToggleOnIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openDeleteDialog(project, 'project')}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              {/* Sprints Tab */}
              <TabPanel value={currentTab} index={2}>
                <TableContainer component={Paper}>
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
                      {sprints.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No sprints found</TableCell>
                        </TableRow>
                      ) : (
                        sprints.map(sprint => (
                          <TableRow key={sprint._id}>
                            <TableCell>{sprint.name}</TableCell>
                            <TableCell>{sprint.project?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={formatStatus(sprint.status, 'sprint')} 
                                color={getStatusColor(sprint.status, 'sprint')}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/sprints/${sprint._id}`)}
                                title="View/Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openStatusDialog(sprint, 'sprint')}
                                title="Change Status"
                              >
                                <ToggleOnIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openDeleteDialog(sprint, 'sprint')}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              {/* Stories Tab */}
              <TabPanel value={currentTab} index={3}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Sprint</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Points</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No stories found</TableCell>
                        </TableRow>
                      ) : (
                        stories.map(story => (
                          <TableRow key={story._id}>
                            <TableCell>{story.title}</TableCell>
                            <TableCell>{story.sprint?.name || 'Backlog'}</TableCell>
                            <TableCell>{story.project?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={formatStatus(story.status)} 
                                color={getStatusColor(story.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{story.points || 0}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/stories/${story._id}`)}
                                title="View/Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openStatusDialog(story, 'story')}
                                title="Change Status"
                              >
                                <ToggleOnIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openDeleteDialog(story, 'story')}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              {/* Tasks Tab */}
              <TabPanel value={currentTab} index={4}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Assignee</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No tasks found</TableCell>
                        </TableRow>
                      ) : (
                        tasks.map(task => (
                          <TableRow key={task.id}>
                            <TableCell>{task.taskName}</TableCell>
                            <TableCell>{task.project?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={task.status} 
                                color={task.status === TaskStatus.DONE ? 'success' : 
                                       task.status === TaskStatus.IN_PROGRESS ? 'warning' :
                                       task.status === TaskStatus.BLOCKED ? 'error' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={task.priority} 
                                color={task.priority === TaskPriority.CRITICAL ? 'error' :
                                       task.priority === TaskPriority.HIGH ? 'warning' :
                                       task.priority === TaskPriority.MEDIUM ? 'info' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{task.assignee?.name || 'Unassigned'}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                title="View/Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openStatusDialog(task, 'task')}
                                title="Change Status"
                              >
                                <ToggleOnIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openDeleteDialog(task, 'task')}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              {/* Defects Tab */}
              <TabPanel value={currentTab} index={5}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Reported By</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {defects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No defects found</TableCell>
                        </TableRow>
                      ) : (
                        defects.map(defect => (
                          <TableRow key={defect.id}>
                            <TableCell>{defect.title}</TableCell>
                            <TableCell>{defect.project?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={defect.status} 
                                color={defect.status === DefectStatus.FIXED ? 'success' :
                                       defect.status === DefectStatus.IN_PROGRESS ? 'warning' :
                                       defect.status === DefectStatus.OPEN ? 'error' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={defect.severity} 
                                color={defect.severity === DefectSeverity.CRITICAL ? 'error' :
                                       defect.severity === DefectSeverity.HIGH ? 'warning' :
                                       defect.severity === DefectSeverity.MEDIUM ? 'info' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{defect.reportedBy?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/defects/${defect.id}`)}
                                title="View/Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openStatusDialog(defect, 'defect')}
                                title="Change Status"
                              >
                                <ToggleOnIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => openDeleteDialog(defect, 'defect')}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </>
          )}
        </Paper>
      </Box>
      
      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, item: null, type: '', newStatus: '' })}>
        <DialogTitle>
          Update {statusDialog.type?.charAt(0).toUpperCase() + statusDialog.type?.slice(1)} Status
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a new status for {statusDialog.item?.name || statusDialog.item?.title || statusDialog.item?.taskName}
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={handleStatusChange}
              label="Status"
            >
              {getStatusOptions(statusDialog.type).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, item: null, type: '', newStatus: '' })}>
            Cancel
          </Button>
          <Button onClick={handleStatusUpdate} variant="contained" color="primary" disabled={loading}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="error" sx={{ mr: 1 }} />
            Confirm Deletion
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The item will be permanently deleted.
          </Alert>
          <DialogContentText>
            To confirm deletion of <strong>{deleteDialog.item?.name || deleteDialog.item?.title || ''}</strong>, 
            please type <strong>delete {deleteDialog.item?.name || deleteDialog.item?.title || deleteDialog.item?._id}</strong> below:
          </DialogContentText>
          <TextField
            fullWidth
            margin="normal"
            value={deleteDialog.confirmation}
            onChange={(e) => setDeleteDialog({ ...deleteDialog, confirmation: e.target.value })}
            error={deleteDialog.confirmation !== '' && 
                  deleteDialog.confirmation !== `delete ${deleteDialog.item?.name || deleteDialog.item?.title || deleteDialog.item?._id}`}
            helperText={deleteDialog.confirmation !== '' && 
                       deleteDialog.confirmation !== `delete ${deleteDialog.item?.name || deleteDialog.item?.title || deleteDialog.item?._id}` ? 
                       'Text does not match' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDelete}
            disabled={loading || 
                     deleteDialog.confirmation !== `delete ${deleteDialog.item?.name || deleteDialog.item?.title || deleteDialog.item?._id}`}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StratFlowAdmin; 