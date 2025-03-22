import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { userService } from '../services/userService';

const UserManagement = () => {
  const [stratflowUsers, setStratflowUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  // StratFlow-specific roles
  const stratflowRoles = [
    'Developer',
    'Scrum Master',
    'Product Owner',
    'Business Analyst',
    'QA Tester',
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      console.log('📥 All users:', allUsers);

      // Filter users into StratFlow and available users
      const stratflow = allUsers.filter(user => user.stratflowRole);
      const available = allUsers.filter(user => !user.stratflowRole);

      console.log('📊 StratFlow users:', stratflow);
      console.log('📊 Available users:', available);

      setStratflowUsers(stratflow);
      setAvailableUsers(available);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleAddUser = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both a user and a role');
      return;
    }

    try {
      console.log('📝 Adding user to StratFlow:', {
        user: selectedUser,
        role: selectedRole
      });

      await userService.updateUserRole(selectedUser._id, selectedRole);
      toast.success('User added to StratFlow successfully');
      setOpenDialog(false);
      setSelectedUser(null);
      setSelectedRole('');
      fetchUsers();
    } catch (error) {
      console.error('❌ Error adding user to StratFlow:', error);
      toast.error('Failed to add user to StratFlow');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filterUsers = (users, term) => {
    if (!term) return users;

    const searchLower = term.toLowerCase();
    return users.filter(user =>
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.employeeId?.toLowerCase().includes(searchLower)
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          StratFlow User Management
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <TextField
            placeholder="Search StratFlow users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add to StratFlow
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              StratFlow Users
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>StratFlow Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterUsers(stratflowUsers, searchTerm).map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.employeeId}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.stratflowRole}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Role">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(user.stratflowRole);
                              setOpenDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit User Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setSelectedUser(null);
            setSelectedRole('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedUser ? 'Edit StratFlow Role' : 'Add User to StratFlow'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              {!selectedUser && (
                <Autocomplete
                  options={availableUsers}
                  getOptionLabel={(user) => 
                    `${user.firstName} ${user.lastName} (${user.employeeId})`
                  }
                  value={selectedUser}
                  onChange={(event, newValue) => {
                    setSelectedUser(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      fullWidth
                    />
                  )}
                />
              )}

              <FormControl fullWidth>
                <InputLabel>StratFlow Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {stratflowRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setSelectedUser(null);
              setSelectedRole('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              variant="contained"
              color="primary"
            >
              {selectedUser ? 'Update Role' : 'Add to StratFlow'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserManagement; 