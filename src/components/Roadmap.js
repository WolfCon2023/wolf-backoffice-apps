import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import sprintService from '../services/sprintService';
import { projectService } from '../services/projectService';

const Roadmap = () => {
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewSprint, setOpenNewSprint] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);

  const [newSprint, setNewSprint] = useState({
    name: '',
    projectId: '',
    startDate: '',
    endDate: '',
    goals: '',
    status: 'PLANNED',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sprintsData, projectsData] = await Promise.all([
        sprintService.getAllSprints(),
        projectService.getAllProjects()
      ]);
      setSprints(sprintsData);
      setProjects(projectsData);
    } catch (error) {
      toast.error('Failed to fetch roadmap data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    try {
      if (!newSprint.name || !newSprint.projectId || !newSprint.startDate || !newSprint.endDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await sprintService.createSprint(newSprint);
      setSprints([...sprints, response]);
      setOpenNewSprint(false);
      setNewSprint({
        name: '',
        projectId: '',
        startDate: '',
        endDate: '',
        goals: '',
        status: 'PLANNED',
      });
      toast.success('Sprint created successfully!');
    } catch (error) {
      toast.error('Failed to create sprint');
    }
  };

  const handleDeleteSprint = async (id) => {
    try {
      await sprintService.deleteSprint(id);
      setSprints(sprints.filter(sprint => sprint.id !== id));
      toast.success('Sprint deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete sprint');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      PLANNED: 'default',
      IN_PROGRESS: 'primary',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return statusColors[status] || 'default';
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
          <Typography variant="h4">Roadmap</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewSprint(true)}
          >
            New Sprint
          </Button>
        </Box>

        <Grid container spacing={3}>
          {sprints.map((sprint) => (
            <Grid item xs={12} md={4} key={sprint.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" noWrap>
                      {sprint.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedSprint(sprint);
                          setOpenNewSprint(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSprint(sprint.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Project: {projects.find(p => p.id === sprint.projectId)?.name || 'Unknown'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(sprint.startDate), 'MMM d, yyyy')} - {format(new Date(sprint.endDate), 'MMM d, yyyy')}
                    </Typography>
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
                    {sprint.goals}
                  </Typography>

                  <Chip
                    label={sprint.status}
                    size="small"
                    color={getStatusColor(sprint.status)}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* New/Edit Sprint Dialog */}
      <Dialog open={openNewSprint} onClose={() => {
        setOpenNewSprint(false);
        setSelectedSprint(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSprint ? 'Edit Sprint' : 'Create New Sprint'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Sprint Name"
              fullWidth
              required
              value={selectedSprint?.name || newSprint.name}
              onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
            />
            <TextField
              select
              label="Project"
              fullWidth
              required
              value={selectedSprint?.projectId || newSprint.projectId}
              onChange={(e) => setNewSprint({ ...newSprint, projectId: e.target.value })}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={selectedSprint?.startDate || newSprint.startDate}
              onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={selectedSprint?.endDate || newSprint.endDate}
              onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
            />
            <TextField
              label="Goals"
              fullWidth
              multiline
              rows={3}
              value={selectedSprint?.goals || newSprint.goals}
              onChange={(e) => setNewSprint({ ...newSprint, goals: e.target.value })}
            />
            <TextField
              select
              label="Status"
              fullWidth
              value={selectedSprint?.status || newSprint.status}
              onChange={(e) => setNewSprint({ ...newSprint, status: e.target.value })}
            >
              <MenuItem value="PLANNED">Planned</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenNewSprint(false);
            setSelectedSprint(null);
          }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateSprint}>
            {selectedSprint ? 'Update Sprint' : 'Create Sprint'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Roadmap; 