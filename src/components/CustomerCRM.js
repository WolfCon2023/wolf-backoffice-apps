import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Typography, Container, Box, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Card, CardContent, MenuItem, Select, InputLabel, FormControl
} from "@mui/material";
import "./CustomerCRM.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || "https://wolf-backoffice-backend-development.up.railway.app/api";

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

const CustomerCRM = () => {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    businessEmail: "",
    phoneNumber: "",
    productLines: "",
    assignedRep: null,
  });

  const queryClient = useQueryClient();

  // 🔍 Search customers
  const handleSearch = async () => {
    if (!search) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/customers/search?query=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("❌ Error fetching customers:", error.response?.data || error.message);
    }
  };

  // ✅ Add a new customer with logging
  const addCustomerMutation = useMutation({
    mutationFn: async (customer) => {
      const token = localStorage.getItem("token");

      // ✅ Debugging Logs
      console.log("📡 Sending POST request to:", `${API_BASE_URL}/customers`, customer);
      console.log("📡 Request Headers:", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      });
      console.log("📡 Request Payload:", JSON.stringify(customer));

      try {
        const response = await axios.post(`${API_BASE_URL}/customers`, customer, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        console.log("✅ Customer added successfully:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Error adding customer:", error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      handleSearch();
    },
    onError: (error) => {
      console.error("❌ Mutation failed:", error.response?.data || error.message);
    }
  });

  const handleAddCustomer = () => {
    addCustomerMutation.mutate({
      ...newCustomer,
      assignedRep: newCustomer.assignedRep || null, // Ensure assignedRep is either a valid ID or null
    });
  };
  

  return (
    <Container maxWidth="lg" className="customer-container">
      <Typography variant="h4" sx={{ textAlign: "center", mt: 3 }}>
        Customer Relationship Management (CRM)
      </Typography>

      {/* 🔹 Quick Actions & Stats */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={4}>
          <Card className="crm-widget">
            <CardContent>
              <Typography variant="h6">Total Customers</Typography>
              <Typography variant="h4">{customers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card className="crm-widget">
            <CardContent>
              <Typography variant="h6">High-Value Clients</Typography>
              <Typography variant="h4">5</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card className="crm-widget">
            <CardContent>
              <Typography variant="h6">Upcoming Meetings</Typography>
              <Button variant="contained" component={Link} to="/schedule-appointment">
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 🔹 Search Bar */}
      <Box className="search-container">
        <TextField
          label="Search Customers"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="contained" color="success" onClick={() => setOpen(true)}>
          Add Customer
        </Button>
      </Box>

      {/* 🆕 Add Customer Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <TextField label="First Name" fullWidth margin="dense" onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} />
          <TextField label="Last Name" fullWidth margin="dense" onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} />
          <TextField label="Email" fullWidth margin="dense" onChange={(e) => setNewCustomer({ ...newCustomer, businessEmail: e.target.value })} />
          <TextField label="Phone Number" fullWidth margin="dense" onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })} />

          {/* 🔹 Product Line Dropdown */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Product Line</InputLabel>
            <Select
              value={newCustomer.productLines}
              onChange={(e) => setNewCustomer({ ...newCustomer, productLines: e.target.value })}
            >
              {PRODUCT_LINES.map((line) => (
                <MenuItem key={line} value={line}>
                  {line}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerCRM;
