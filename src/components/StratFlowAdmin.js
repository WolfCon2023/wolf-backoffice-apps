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
import projectService from '../services/projectService';
import sprintService from '../services/sprintService';
import storyService from '../services/storyService';

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
  
  // Dialog states
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    item: null,
    type: '',
    newStatus: ''
  });
  
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

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    
    const formattedStatus = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'ON_HOLD': 'On Hold',
      'COMPLETED': 'Completed',
      'DELETED': 'Deleted'
    }[status] || status;
    
    return formattedStatus;
  };

  const getStatusColor = (status) => {
    return {
      'ACTIVE': 'success',
      'INACTIVE': 'default',
      'ON_HOLD': 'warning',
      'COMPLETED': 'info',
      'DELETED': 'error'
    }[status] || 'default';
  };

  // Open status change dialog
  const openStatusDialog = (item, type) => {
    setStatusDialog({
      open: true,
      item,
      type,
      newStatus: item.status
    });
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
    const { item, type, newStatus } = statusDialog;
    setLoading(true);
    
    try {
      let result;
      
      switch (type) {
        case 'team':
          result = await teamService.updateTeamStatus(item._id, newStatus);
          break;
        case 'project':
          result = await projectService.updateProjectStatus(item._id, newStatus);
          break;
        case 'sprint':
          result = await sprintService.updateSprintStatus(item._id, newStatus);
          break;
        case 'story':
          result = await storyService.updateStoryStatus(item._id, newStatus);
          break;
        default:
          throw new Error('Unknown item type');
      }
      
      toast.success(`Status updated to ${formatStatus(newStatus)}`);
      setStatusDialog({ open: false, item: null, type: '', newStatus: '' });
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
    if (confirmation !== `delete ${item.name || item.title || item._id}`) {
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
      <Box sx={{ width: '100%', mt: 3 }}>
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            StratFlow Admin Tool
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Manage status changes and deletions for all StratFlow resources
          </Typography>
        </Paper>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Teams" />
            <Tab label="Projects" />
            <Tab label="Sprints" />
            <Tab label="Stories" />
          </Tabs>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={refreshData}
            disabled={loading}
          >
            Refresh
          </Button>
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
                              label={formatStatus(sprint.status)} 
                              color={getStatusColor(sprint.status)}
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
          </>
        )}
      </Box>
      
      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })}>
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Update the status for {statusDialog.item?.name || statusDialog.item?.title || ''}.
          </DialogContentText>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusDialog.newStatus || ''}
              onChange={(e) => setStatusDialog({ ...statusDialog, newStatus: e.target.value })}
              label="Status"
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="ON_HOLD">On Hold</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ ...statusDialog, open: false })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleStatusUpdate}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Status'}
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