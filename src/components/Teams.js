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
  Avatar,
  AvatarGroup,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import teamService from '../services/teamService';

const Teams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewTeam, setOpenNewTeam] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching teams list...');
      const fetchedTeams = await teamService.getAllTeams();
      
      console.log(`✅ Fetched ${fetchedTeams.length} teams`);
      setTeams(fetchedTeams);
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      toast.error('Failed to load teams');
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

      const teamData = {
        name: newTeam.name.trim(),
        description: newTeam.description?.trim() || '',
        status: 'ACTIVE',
        members: []
      };

      console.log('📝 Creating team with data:', teamData);
      
      const response = await teamService.createTeam(teamData);
      
      setTeams([...teams, response]);
      setOpenNewTeam(false);
      setNewTeam({
        name: '',
        description: '',
        status: 'ACTIVE'
      });
      toast.success('Team created successfully!');
    } catch (error) {
      console.error('❌ Error creating team:', error);
      toast.error(`Failed to create team: ${error.message}`);
    }
  };

  const handleViewTeam = (team) => {
    navigate(`/teams/${team._id}`);
    setAnchorEl(null);
  };

  const handleOpenEditTeam = (team) => {
    navigate(`/teams/${team._id}/edit`);
    setAnchorEl(null);
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    
    const formattedStatus = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'ON_HOLD': 'On Hold'
    }[status] || status;
    
    return formattedStatus;
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
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewTeam(true)}
            >
              New Team
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} sm={6} md={4} key={team._id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 }
                }}
                onClick={() => navigate(`/teams/${team._id}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {team.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={formatStatus(team.status)} 
                        color={
                          team.status === 'ACTIVE' ? 'success' : 
                          team.status === 'INACTIVE' ? 'default' :
                          team.status === 'ON_HOLD' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnchorEl(e.currentTarget);
                          setSelectedTeam(team);
                        }}
                        sx={{ ml: 1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {team.members?.length || 0} Members
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog 
        open={openNewTeam} 
        onClose={() => setOpenNewTeam(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Team Name"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={4}
            value={newTeam.description}
            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewTeam(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCreateTeam}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedTeam(null);
        }}
        MenuListProps={{
          'aria-labelledby': 'team-actions-button',
        }}
      >
        {selectedTeam && (
          <>
            <MenuItem
              onClick={() => handleViewTeam(selectedTeam)}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              View/Edit
            </MenuItem>
          </>
        )}
      </Menu>
    </Container>
  );
};

export default Teams; 