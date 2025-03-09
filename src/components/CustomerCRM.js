import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Typography, Container, Box, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Card, CardContent, MenuItem, Select, InputLabel, FormControl, FormControlLabel, Checkbox, IconButton, Tooltip, Pagination
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import { FaCalendarAlt, FaClipboardList, FaUserFriends, FaUsers, FaPlusCircle, FaChartLine, FaUserTie, FaIndustry } from "react-icons/fa";
import { Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { customerService } from '../services/customerService';
import "./CustomerCRM.css";

// Constants
const ITEMS_PER_PAGE = 20;

// 🎯 Predefined Product Lines (Sorted Alphabetically)
const PRODUCT_LINES = [
  "Agile Transformation",
  "Business Consultation",
  "IT Auditing",
  "IT Compliance",
  "Network Engineering",
  "SDLC Consulting",
  "Software Development"
];

// 🔍 Search Criteria Options
const SEARCH_CRITERIA = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "businessEmail", label: "Business Email" },
  { value: "phoneNumber", label: "Phone Number" },
  { value: "productLines", label: "Product Lines" },
  { value: "highValue", label: "High Value" }
];

const CustomerCRM = () => {
  // Initialize all state variables
  const [search, setSearch] = useState("");
  const [searchCriteria, setSearchCriteria] = useState("firstName");
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [page, setPage] = useState(1);
  const [dialogTitle, setDialogTitle] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    businessEmail: "",
    phoneNumber: "",
    productLines: "",
    assignedRep: null,
    highValue: false
  });

  const queryClient = useQueryClient();

  // Fetch all customers for stats
  const { data: allCustomers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAllCustomers
  });

  // Calculate high-value customers from all customers
  const highValueCustomers = allCustomers?.filter(customer => customer.highValue) || [];

  // Calculate pagination
  const totalPages = Math.ceil((searchResults.length || 0) / ITEMS_PER_PAGE);
  const paginatedResults = searchResults.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Handle stats card click
  const handleStatsClick = async (type) => {
    try {
      let results;
      if (type === 'total') {
        results = await customerService.getAllCustomers();
        setDialogTitle('All Customers');
      } else if (type === 'highValue') {
        results = (await customerService.getAllCustomers()).filter(customer => customer.highValue);
        setDialogTitle('High-Value Customers');
      }
      setSearchResults(results || []);
      setPage(1); // Reset to first page
      setSearchResultsOpen(true);
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
      setSearchResults([]);
    }
  };

  // 🔍 Search customers
  const handleSearch = async () => {
    try {
      if (!search && searchCriteria !== 'highValue') {
        const results = await customerService.getAllCustomers();
        setSearchResults(results || []);
        setDialogTitle('All Customers');
      } else {
        const results = await customerService.searchCustomers(searchCriteria, search);
        setSearchResults(Array.isArray(results) ? results : []);
        setDialogTitle('Search Results');
      }
      setPage(1); // Reset to first page
      setSearchResultsOpen(true);
    } catch (error) {
      console.error("❌ Error searching customers:", error);
      setSearchResults([]);
    }
  };

  // Handle search criteria change
  const handleSearchCriteriaChange = (event) => {
    const newCriteria = event.target.value;
    setSearchCriteria(newCriteria);
    
    if (newCriteria === 'highValue') {
      setSearch('true');
      handleSearch();
    } else {
      setSearch('');
    }
  };

  // Handle Enter key in search
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // ✅ Add a new customer
  const addCustomerMutation = useMutation({
    mutationFn: customerService.addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        businessEmail: "",
        phoneNumber: "",
        productLines: "",
        assignedRep: null,
        highValue: false
      });
      handleSearch();
    },
    onError: (error) => {
      console.error("❌ Mutation failed:", error);
    }
  });

  // ✅ Update customer
  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, customer }) => customerService.updateCustomer(id, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      handleSearch();
    },
    onError: (error) => {
      console.error("❌ Update mutation failed:", error);
    }
  });

  const handleAddCustomer = () => {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.businessEmail || !newCustomer.phoneNumber || !newCustomer.productLines) {
      alert("Please fill in all required fields");
      return;
    }
    addCustomerMutation.mutate(newCustomer);
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer.firstName || !selectedCustomer.lastName || !selectedCustomer.businessEmail || !selectedCustomer.phoneNumber || !selectedCustomer.productLines) {
      alert("Please fill in all required fields");
      return;
    }
    updateCustomerMutation.mutate({
      id: selectedCustomer._id,
      customer: selectedCustomer
    });
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer({ ...customer });
    setEditDialogOpen(true);
  };

  return (
    <Container maxWidth="lg" className="customer-container" sx={{ mb: 8 }}>
      <Typography variant="h4" sx={{ textAlign: "center", mt: 3, mb: 4 }}>
        Customer Relationship Management (CRM)
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        {/* Total Customers Card */}
        <Grid item xs={12} md={6}>
          <Card 
            className="crm-widget clickable"
            onClick={() => handleStatsClick('total')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FaUsers style={{ fontSize: '20px', color: '#666', marginRight: '8px' }} />
                <Typography variant="subtitle1" color="textSecondary">
                  TOTAL CUSTOMERS
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ my: 2, color: '#1976d2' }}>
                {isLoadingCustomers ? "Loading..." : (allCustomers?.length || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View complete customer list
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* High Value Clients Card */}
        <Grid item xs={12} md={6}>
          <Card 
            className="crm-widget clickable"
            onClick={() => handleStatsClick('highValue')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FaUserTie style={{ fontSize: '20px', color: '#666', marginRight: '8px' }} />
                <Typography variant="subtitle1" color="textSecondary">
                  HIGH-VALUE CLIENTS
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ my: 2, color: '#1976d2' }}>
                {isLoadingCustomers ? "Loading..." : highValueCustomers.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View high-value customer details
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Meetings Card */}
        <Grid item xs={12} md={6}>
          <Card className="crm-widget">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ fontSize: '20px', color: '#666', mr: 1 }} />
                <Typography variant="subtitle1" color="textSecondary">
                  UPCOMING MEETINGS
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ my: 2, color: '#1976d2' }}>
                Appointments
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View and manage schedules
              </Typography>
              <Button 
                component={Link}
                to="/calendar"
                variant="contained"
                sx={{ mt: 2 }}
              >
                OPEN CALENDAR
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Links */}
        <Grid item xs={12} md={6}>
          <Card className="crm-widget">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ fontSize: '20px', color: '#666', mr: 1 }} />
                <Typography variant="subtitle1" color="textSecondary">
                  ANALYTICS
                </Typography>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  component={Link}
                  to="/analytics/customers/insights"
                  variant="outlined"
                >
                  Customer Insights
                </Button>
                <Button
                  component={Link}
                  to="/analytics/appointments/trends"
                  variant="outlined"
                >
                  Appointment Trends
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Section */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Search By
        </Typography>
        <Select
          size="small"
          value={searchCriteria}
          onChange={handleSearchCriteriaChange}
          sx={{ minWidth: 120 }}
        >
          {SEARCH_CRITERIA.map((criteria) => (
            <MenuItem key={criteria.value} value={criteria.value}>
              {criteria.label}
            </MenuItem>
          ))}
        </Select>
        <TextField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={searchCriteria === 'highValue'}
          sx={{ flexGrow: 1 }}
        />
        <Button 
          variant="contained"
          size="small"
          onClick={handleSearch}
          disabled={!search && searchCriteria !== 'highValue'}
        >
          Search
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setOpen(true)}
        >
          Add Customer
        </Button>
      </Box>

      {/* 🔍 Results Dialog with Pagination */}
      <Dialog 
        open={searchResultsOpen} 
        onClose={() => setSearchResultsOpen(false)}
        maxWidth="lg"
        fullWidth
        className="results-dialog"
      >
        <DialogTitle>
          {dialogTitle}
          <Typography variant="subtitle1" color="textSecondary">
            Showing {paginatedResults.length} of {searchResults.length} results
          </Typography>
        </DialogTitle>
        <DialogContent>
          {searchResults.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>First Name</TableCell>
                      <TableCell>Last Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Product Line</TableCell>
                      <TableCell>High Value</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedResults.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>{customer.firstName}</TableCell>
                        <TableCell>{customer.lastName}</TableCell>
                        <TableCell>{customer.businessEmail}</TableCell>
                        <TableCell>{customer.phoneNumber}</TableCell>
                        <TableCell>{customer.productLines}</TableCell>
                        <TableCell>{customer.highValue ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit Customer">
                            <IconButton onClick={() => handleEditCustomer(customer)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          ) : (
            <Typography align="center" sx={{ py: 3 }}>
              No customers found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchResultsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* 🆕 Add Customer Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField 
              label="First Name" 
              fullWidth 
              value={newCustomer.firstName}
              onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} 
            />
            <TextField 
              label="Last Name" 
              fullWidth 
              value={newCustomer.lastName}
              onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} 
            />
            <TextField 
              label="Email" 
              fullWidth 
              type="email"
              value={newCustomer.businessEmail}
              onChange={(e) => setNewCustomer({ ...newCustomer, businessEmail: e.target.value })} 
            />
            <TextField 
              label="Phone Number" 
              fullWidth 
              value={newCustomer.phoneNumber}
              onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })} 
            />
            <FormControl fullWidth>
              <InputLabel>Product Line</InputLabel>
              <Select
                value={newCustomer.productLines}
                onChange={(e) => setNewCustomer({ ...newCustomer, productLines: e.target.value })}
                label="Product Line"
              >
                {PRODUCT_LINES.map((line) => (
                  <MenuItem key={line} value={line}>
                    {line}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newCustomer.highValue}
                  onChange={(e) => setNewCustomer({ ...newCustomer, highValue: e.target.checked })}
                />
              }
              label="High Value Customer"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>

      {/* 🔄 Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField 
                label="First Name" 
                fullWidth 
                value={selectedCustomer.firstName}
                onChange={(e) => setSelectedCustomer({ ...selectedCustomer, firstName: e.target.value })} 
              />
              <TextField 
                label="Last Name" 
                fullWidth 
                value={selectedCustomer.lastName}
                onChange={(e) => setSelectedCustomer({ ...selectedCustomer, lastName: e.target.value })} 
              />
              <TextField 
                label="Email" 
                fullWidth 
                type="email"
                value={selectedCustomer.businessEmail}
                onChange={(e) => setSelectedCustomer({ ...selectedCustomer, businessEmail: e.target.value })} 
              />
              <TextField 
                label="Phone Number" 
                fullWidth 
                value={selectedCustomer.phoneNumber}
                onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phoneNumber: e.target.value })} 
              />
              <FormControl fullWidth>
                <InputLabel>Product Line</InputLabel>
                <Select
                  value={selectedCustomer.productLines}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, productLines: e.target.value })}
                  label="Product Line"
                >
                  {PRODUCT_LINES.map((line) => (
                    <MenuItem key={line} value={line}>
                      {line}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedCustomer.highValue}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, highValue: e.target.checked })}
                  />
                }
                label="High Value Customer"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateCustomer} variant="contained" color="primary">Update</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerCRM;