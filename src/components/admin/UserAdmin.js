import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Tabs,
  Tab,
  CircularProgress,
  Menu,
  AppBar,
  Toolbar,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import { CSVLink } from 'react-csv';

const UserAdmin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    departmentBreakdown: {},
    roleBreakdown: {},
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    department: 'all',
    role: 'all',
  });

  const [newUser, setNewUser] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    department: '',
    title: '',
    role: '',
    password: '',
  });

  // Available roles and departments
  const availableRoles = [
    'Developer',
    'Scrum Master',
    'Product Owner',
    'Business Analyst',
    'QA Tester'
  ];

  const departments = [
    'Executive',
    'Human Resources',
    'Information Technology',
    'Finance',
    'Operations',
    'Sales',
    'Marketing',
    'Customer Support',
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      calculateStats();
    }
  }, [users]);

  const calculateStats = () => {
    const departmentCount = {};
    const roleCount = {};
    let active = 0;

    users.forEach(user => {
      // Count by department
      if (user.department) {
        departmentCount[user.department] = (departmentCount[user.department] || 0) + 1;
      }
      // Count by role
      if (user.role) {
        roleCount[user.role] = (roleCount[user.role] || 0) + 1;
      }
      // Count active users (those with roles)
      if (user.role) active++;
    });

    setStats({
      totalUsers: users.length,
      activeUsers: active,
      departmentBreakdown: departmentCount,
      roleBreakdown: roleCount,
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      console.log('📥 All users:', response);
      const usersList = Array.isArray(response) ? response : response.data || [];
      setUsers(usersList);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate required fields
      const requiredFields = ['username', 'firstName', 'lastName', 'email'];
      const missingFields = requiredFields.filter(field => !newUser[field]);
      
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Generate a temporary password if none is provided
      const userData = {
        ...newUser,
        password: newUser.password || `${newUser.firstName.toLowerCase()}${newUser.lastName.toLowerCase()}123!`,
        role: newUser.role || 'Developer' // Set default role if none provided
      };

      await userService.createUser(userData);
      toast.success('User created successfully');
      setOpenDialog(false);
      setNewUser({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        employeeId: '',
        department: '',
        title: '',
        role: '',
        password: '',
      });
      fetchUsers();
    } catch (error) {
      console.error('❌ Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      await userService.updateUser(selectedUser._id, selectedUser);
      toast.success('User updated successfully');
      setOpenDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const filterUsers = (users, term, filters) => {
    return users.filter(user => {
      const matchesSearch = !term || 
        user.firstName?.toLowerCase().includes(term.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(term.toLowerCase()) ||
        user.email?.toLowerCase().includes(term.toLowerCase()) ||
        user.employeeId?.toLowerCase().includes(term.toLowerCase()) ||
        user.username?.toLowerCase().includes(term.toLowerCase());

      const matchesDepartment = filters.department === 'all' || user.department === filters.department;
      const matchesRole = filters.role === 'all' || user.role === filters.role;

      return matchesSearch && matchesDepartment && matchesRole;
    });
  };

  const generateCSVData = () => {
    return filterUsers(users, searchTerm, filters).map(user => ({
      Username: user.username,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      Email: user.email,
      'Employee ID': user.employeeId,
      Department: user.department,
      Title: user.title,
      Role: user.role,
    }));
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => (
    <Box>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<GroupIcon sx={{ fontSize: 40, color: '#2196f3' }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<AdminIcon sx={{ fontSize: 40, color: '#4caf50' }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Departments"
            value={Object.keys(stats.departmentBreakdown).length}
            icon={<BusinessIcon sx={{ fontSize: 40, color: '#ff9800' }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="User Roles"
            value={Object.keys(stats.roleBreakdown).length}
            icon={<AssessmentIcon sx={{ fontSize: 40, color: '#f44336' }} />}
            color="#f44336"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Distribution
              </Typography>
              {Object.entries(stats.departmentBreakdown).map(([dept, count]) => (
                <Box key={dept} sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{dept}</Typography>
                    <Typography variant="body2">{count} users</Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(count / stats.totalUsers) * 100}%`,
                        height: '100%',
                        backgroundColor: '#2196f3',
                        borderRadius: 4,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Distribution
              </Typography>
              {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                <Box key={role} sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{role}</Typography>
                    <Typography variant="body2">{count} users</Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(count / stats.totalUsers) * 100}%`,
                        height: '100%',
                        backgroundColor: '#4caf50',
                        borderRadius: 4,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderUserList = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search users..."
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
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            variant="outlined"
          >
            Filters
          </Button>
        </Box>
        <Box display="flex" gap={2}>
          <CSVLink
            data={generateCSVData()}
            filename="user-report.csv"
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </CSVLink>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedUser(null);
              setOpenDialog(true);
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            >
              <MenuItem value="all">All Roles</MenuItem>
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Menu>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filterUsers(users, searchTerm, filters).map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.employeeId}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setOpenDialog(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <DeleteIcon />
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
    </Box>
  );

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: '#0056b3' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            User Administration
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant={activeTab === 0 ? "contained" : "outlined"}
                startIcon={<DashboardIcon />}
                onClick={() => setActiveTab(0)}
                sx={{ mr: 1 }}
              >
                Dashboard
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant={activeTab === 1 ? "contained" : "outlined"}
                startIcon={<SettingsIcon />}
                onClick={() => setActiveTab(1)}
              >
                Settings
              </Button>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {activeTab === 0 && renderDashboard()}
            {activeTab === 1 && renderUserList()}
          </Box>
        )}

        {/* Add/Edit User Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setSelectedUser(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              <TextField
                label="Username"
                fullWidth
                value={selectedUser ? selectedUser.username : newUser.username}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, username: e.target.value });
                  } else {
                    setNewUser({ ...newUser, username: e.target.value });
                  }
                }}
              />
              <TextField
                label="First Name"
                fullWidth
                value={selectedUser ? selectedUser.firstName : newUser.firstName}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, firstName: e.target.value });
                  } else {
                    setNewUser({ ...newUser, firstName: e.target.value });
                  }
                }}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={selectedUser ? selectedUser.lastName : newUser.lastName}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, lastName: e.target.value });
                  } else {
                    setNewUser({ ...newUser, lastName: e.target.value });
                  }
                }}
              />
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={selectedUser ? selectedUser.email : newUser.email}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, email: e.target.value });
                  } else {
                    setNewUser({ ...newUser, email: e.target.value });
                  }
                }}
              />
              <TextField
                label="Employee ID"
                fullWidth
                value={selectedUser ? selectedUser.employeeId : newUser.employeeId}
                onChange={(e) => {
                  // Remove any non-numeric characters from the input
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  // Construct the employee ID with the prefix
                  const employeeId = numericValue ? `EMP-${numericValue}` : '';
                  
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, employeeId });
                  } else {
                    setNewUser({ ...newUser, employeeId });
                  }
                }}
                placeholder="EMP-1234"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">EMP-</InputAdornment>
                  ),
                }}
                // Only show error if there's input and it's not in the correct format
                error={Boolean((selectedUser?.employeeId || newUser.employeeId) && !/^EMP-\d+$/.test(selectedUser?.employeeId || newUser.employeeId))}
                helperText={(selectedUser?.employeeId || newUser.employeeId) && !/^EMP-\d+$/.test(selectedUser?.employeeId || newUser.employeeId) ? "Please enter only numbers" : ""}
              />
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedUser ? selectedUser.department : newUser.department}
                  onChange={(e) => {
                    if (selectedUser) {
                      setSelectedUser({ ...selectedUser, department: e.target.value });
                    } else {
                      setNewUser({ ...newUser, department: e.target.value });
                    }
                  }}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Title"
                fullWidth
                value={selectedUser ? selectedUser.title : newUser.title}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, title: e.target.value });
                  } else {
                    setNewUser({ ...newUser, title: e.target.value });
                  }
                }}
              />
              {!selectedUser && (
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  margin="normal"
                  helperText="Leave blank to generate a temporary password"
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser ? selectedUser.role : newUser.role}
                  onChange={(e) => {
                    if (selectedUser) {
                      setSelectedUser({ ...selectedUser, role: e.target.value });
                    } else {
                      setNewUser({ ...newUser, role: e.target.value });
                    }
                  }}
                >
                  {availableRoles.map((role) => (
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
            }}>
              Cancel
            </Button>
            <Button
              onClick={selectedUser ? handleUpdateUser : handleCreateUser}
              variant="contained"
              color="primary"
            >
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserAdmin; 