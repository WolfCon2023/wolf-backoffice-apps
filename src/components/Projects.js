import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Chip,
  Menu,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import projectService from '../services/projectService';
import LoadingSpinner from './shared/LoadingSpinner';
import StatusChip from './shared/StatusChip';
import { handleApiError, validateRequired } from '../utils/errorHandler';
import { DATE_FORMATS } from '../utils/config';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    methodology: 'Agile',
    team: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('❌ Invalid data format received:', data);
        toast.error('Error loading projects. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      toast.error('Error loading projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const errors = validateRequired(newProject, ['name']);
      if (Object.keys(errors).length > 0) {
        Object.values(errors).forEach(error => toast.error(error));
        return;
      }

      // Generate a unique key based on the project name
      const key = newProject.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 8) + '-' + Math.floor(Math.random() * 1000);

      const response = await projectService.createProject({
        ...newProject,
        key,
        status: 'ACTIVE',
        progress: 0,
        startDate: newProject.startDate || new Date().toISOString().split('T')[0],
      });

      setProjects([...projects, response]);
      setOpenNewProject(false);
      setNewProject({
        name: '',
        description: '',
        methodology: 'Agile',
        team: '',
        startDate: '',
        endDate: '',
      });
      toast.success('Project created successfully!');
    } catch (error) {
      handleApiError(error, 'createProject');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await projectService.deleteProject(id);
      setProjects(projects.filter(project => project.id !== id));
      setAnchorEl(null);
      toast.success('Project deleted successfully!');
    } catch (error) {
      handleApiError(error, 'deleteProject');
    }
  };

  const filteredProjects = projects
    .filter((project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((project) =>
      selectedStatus === 'all' ? true : project.status === selectedStatus
    );

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Projects</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewProject(true)}
          >
            New Project
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          <Button
            startIcon={<FilterListIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            Filter
          </Button>
        </Box>

        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} md={4} key={project.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" noWrap>
                      {project.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => setAnchorEl({ el: e.currentTarget, id: project.id })}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {project.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <StatusChip status={project.status} sx={{ mr: 1 }} />
                    <Chip label={project.methodology} size="small" />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {project.team}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2">{project.progress}%</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* New Project Dialog */}
      <Dialog open={openNewProject} onClose={() => setOpenNewProject(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Project Name"
              fullWidth
              required
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              error={!newProject.name}
              helperText={!newProject.name && "Project name is required"}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <TextField
              select
              label="Methodology"
              fullWidth
              value={newProject.methodology}
              onChange={(e) => setNewProject({ ...newProject, methodology: e.target.value })}
            >
              <MenuItem value="Agile">Agile</MenuItem>
              <MenuItem value="Waterfall">Waterfall</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
            </TextField>
            <TextField
              label="Team"
              fullWidth
              value={newProject.team}
              onChange={(e) => setNewProject({ ...newProject, team: e.target.value })}
            />
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newProject.endDate}
              onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewProject(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateProject}>
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Actions Menu */}
      <Menu
        anchorEl={anchorEl?.el}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          navigate(`/projects/${anchorEl?.id}`);
          setAnchorEl(null);
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/projects/${anchorEl?.id}/edit`);
          setAnchorEl(null);
        }}>
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteProject(anchorEl?.id)} 
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setSelectedStatus('all');
            setFilterAnchorEl(null);
          }}
        >
          All
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus('ACTIVE');
            setFilterAnchorEl(null);
          }}
        >
          Active
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus('ON_HOLD');
            setFilterAnchorEl(null);
          }}
        >
          On Hold
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus('COMPLETED');
            setFilterAnchorEl(null);
          }}
        >
          Completed
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Projects; 