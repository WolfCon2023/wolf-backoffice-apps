import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Timeline,
  Assignment,
  Group,
  TrendingUp,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import projectService from '../services/projectService';
import teamService from '../services/teamService';
import sprintService from '../services/sprintService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip
);

const StratflowDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projectMetrics, setProjectMetrics] = useState({
    total: 0,
    active: 0,
    completed: 0,
    onHold: 0,
  });
  const [teamMetrics, setTeamMetrics] = useState({
    totalTeams: 0,
    totalMembers: 0,
  });
  const [upcomingSprints, setUpcomingSprints] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTeams: 0,
    activeSprints: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [velocityData, setVelocityData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [projects, teams, sprints] = await Promise.all([
          projectService.getAllProjects(),
          teamService.getAllTeams(),
          sprintService.getAllSprints(),
        ]);

        // Calculate project metrics
        const projectMetricsData = {
          total: projects.length,
          active: projects.filter(p => p.status === 'ACTIVE').length,
          completed: projects.filter(p => p.status === 'COMPLETED').length,
          onHold: projects.filter(p => p.status === 'ON_HOLD').length,
        };
        setProjectMetrics(projectMetricsData);

        // Calculate team metrics
        const teamMetricsData = {
          totalTeams: teams.length,
          totalMembers: teams.reduce((acc, team) => acc + (team.members?.length || 0), 0),
        };
        setTeamMetrics(teamMetricsData);

        // Calculate project progress
        const progressData = projects.map(project => ({
          name: project.name,
          completed: project.progress || 0,
          remaining: 100 - (project.progress || 0),
        }));
        setProjectProgress(progressData);

        // Set upcoming sprints
        const upcomingSprintsData = sprints
          .filter(s => s.status === 'PLANNED' || s.status === 'IN_PROGRESS')
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 5)
          .map(sprint => ({
            ...sprint,
            projectName: projects.find(p => p.id === sprint.projectId)?.name || 'Unknown',
          }));
        setUpcomingSprints(upcomingSprintsData);

        // Calculate metrics
        const activeProjects = projects.filter(p => p.status === 'ACTIVE');
        const activeSprints = sprints.filter(s => s.status === 'IN_PROGRESS');

        setMetrics({
          totalProjects: projects.length,
          activeProjects: activeProjects.length,
          totalTeams: teams.length,
          activeSprints: activeSprints.length,
        });

        // Set recent projects
        const sortedProjects = [...projects]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentProjects(sortedProjects);

        // Calculate velocity data
        const last6Sprints = sprints
          .filter(s => s.status === 'COMPLETED')
          .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
          .slice(0, 6)
          .reverse();

        setVelocityData({
          labels: last6Sprints.map(s => s.name),
          datasets: [{
            label: 'Story Points Completed',
            data: last6Sprints.map(s => s.completedPoints || 0),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          }],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    const statusColors = {
      ACTIVE: 'success',
      COMPLETED: 'default',
      ON_HOLD: 'warning',
      CANCELLED: 'error',
      PLANNED: 'info',
      IN_PROGRESS: 'primary',
    };
    return statusColors[status] || 'default';
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          StratFlow Dashboard
        </Typography>

        {/* Project and Team Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h3" color="primary">
                      {projectMetrics?.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Projects
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Active: {projectMetrics?.active || 0}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={((projectMetrics?.active || 0) / (projectMetrics?.total || 1)) * 100}
                        color="success"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Completed: {projectMetrics?.completed || 0}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={((projectMetrics?.completed || 0) / (projectMetrics?.total || 1)) * 100}
                        color="info"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        On Hold: {projectMetrics?.onHold || 0}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={((projectMetrics?.onHold || 0) / (projectMetrics?.total || 1)) * 100}
                        color="warning"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h3" color="primary">
                      {teamMetrics?.totalTeams || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Teams
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h3" color="secondary">
                      {teamMetrics?.totalMembers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Members
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Project Progress Chart */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Progress
            </Typography>
            <Box sx={{ height: 300 }}>
              {projectProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectProgress}
                    stackOffset="expand"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="completed" stackId="a" fill="#2563eb" name="Completed" />
                    <Bar dataKey="remaining" stackId="a" fill="#e5e7eb" name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">No progress data available</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Upcoming Sprints */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upcoming Sprints
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sprint</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingSprints.length > 0 ? (
                    upcomingSprints.map((sprint) => (
                      <TableRow key={sprint.id}>
                        <TableCell>{sprint.name}</TableCell>
                        <TableCell>{sprint.projectName}</TableCell>
                        <TableCell>
                          {format(new Date(sprint.startDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sprint.status}
                            color={getStatusColor(sprint.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No upcoming sprints
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Metrics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Projects</Typography>
                </Box>
                <Typography variant="h4">{metrics.totalProjects}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.activeProjects} Active Projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group sx={{ mr: 1 }} />
                  <Typography variant="h6">Teams</Typography>
                </Box>
                <Typography variant="h4">{metrics.totalTeams}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Across all projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Timeline sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Sprints</Typography>
                </Box>
                <Typography variant="h4">{metrics.activeSprints}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently in progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="h6">Velocity</Typography>
                </Box>
                <Typography variant="h4">
                  {velocityData.datasets[0]?.data.slice(-1)[0] || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Points in last sprint
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Velocity Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Team Velocity Trend
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line
                    data={velocityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Projects */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Recent Projects
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={project.status}
                              size="small"
                              color={getStatusColor(project.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(project.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StratflowDashboard; 