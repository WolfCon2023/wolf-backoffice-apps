import React, { useState, useEffect } from 'react';
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
  Avatar,
  AvatarGroup,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import teamService from '../services/teamService';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewTeam, setOpenNewTeam] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getAllTeams();
      setTeams(data);
    } catch (error) {
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      if (!newTeam.name) {
        toast.error('Team name is required');
        return;
      }

      const response = await teamService.createTeam({
        ...newTeam,
        members: [],
        status: 'ACTIVE',
      });

      setTeams([...teams, response]);
      setOpenNewTeam(false);
      setNewTeam({
        name: '',
        description: '',
      });
      toast.success('Team created successfully!');
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleDeleteTeam = async (id) => {
    try {
      await teamService.deleteTeam(id);
      setTeams(teams.filter(team => team.id !== id));
      setAnchorEl(null);
      setSelectedTeam(null);
      toast.success('Team deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete team');
    }
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
          <Typography variant="h4">Teams</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewTeam(true)}
          >
            New Team
          </Button>
        </Box>

        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} md={4} key={team.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" noWrap>
                      {team.name}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedTeam(team);
                      }}
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
                    {team.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <AvatarGroup max={4}>
                      {team.members?.map((member) => (
                        <Avatar key={member.id}>
                          {member.name.charAt(0)}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {team.members?.length || 0} Members
                    </Typography>
                    <Chip
                      label={team.status}
                      size="small"
                      color={team.status === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* New Team Dialog */}
      <Dialog open={openNewTeam} onClose={() => setOpenNewTeam(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Team Name"
              fullWidth
              required
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewTeam(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTeam}>
            Create Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedTeam(null);
        }}
      >
        <MenuItem onClick={() => {
          // TODO: Implement view team details
          setAnchorEl(null);
          setSelectedTeam(null);
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Implement edit team
          setAnchorEl(null);
          setSelectedTeam(null);
        }}>
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteTeam(selectedTeam?.id)}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Teams; 