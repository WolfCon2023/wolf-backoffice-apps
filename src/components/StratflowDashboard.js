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
  Button,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Timeline,
  Assignment,
  Group,
  TrendingUp,
  BugReport,
  Task,
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
  ArcElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import projectService from '../services/projectService';
import teamService from '../services/teamService';
import sprintService from '../services/sprintService';
import storyService from '../services/storyService';
import taskService from '../services/taskService';
import defectService from '../services/defectService';
import { Link as RouterLink } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip,
  ArcElement
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
    totalStories: 0,
    totalTasks: 0,
    totalDefects: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [velocityData, setVelocityData] = useState({
    labels: [],
    datasets: [],
  });
  const [backlogMetrics, setBacklogMetrics] = useState({
    stories: {
      total: 0,
      byStatus: {},
      byType: {},
    },
    tasks: {
      total: 0,
      byStatus: {},
      byPriority: {},
    },
    defects: {
      total: 0,
      bySeverity: {},
      byStatus: {},
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let projects = [], teams = [], sprints = [], stories = [], tasks = [], defects = [];

        // Fetch backlog data
        try {
          stories = await storyService.getAllStories();
          tasks = await taskService.getAllTasks();
          defects = await defectService.getAllDefects();

          // Calculate backlog metrics
          const backlogMetricsData = {
            stories: {
              total: stories.length,
              byStatus: stories.reduce((acc, story) => {
                acc[story.status] = (acc[story.status] || 0) + 1;
                return acc;
              }, {}),
              byType: stories.reduce((acc, story) => {
                acc[story.type] = (acc[story.type] || 0) + 1;
                return acc;
              }, {}),
            },
            tasks: {
              total: tasks.length,
              byStatus: tasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
              }, {}),
              byPriority: tasks.reduce((acc, task) => {
                acc[task.priority] = (acc[task.priority] || 0) + 1;
                return acc;
              }, {}),
            },
            defects: {
              total: defects.length,
              bySeverity: defects.reduce((acc, defect) => {
                acc[defect.severity] = (acc[defect.severity] || 0) + 1;
                return acc;
              }, {}),
              byStatus: defects.reduce((acc, defect) => {
                acc[defect.status] = (acc[defect.status] || 0) + 1;
                return acc;
              }, {}),
            },
          };
          setBacklogMetrics(backlogMetricsData);

          // Update overall metrics
          setMetrics(prev => ({
            ...prev,
            totalStories: stories.length,
            totalTasks: tasks.length,
            totalDefects: defects.length,
          }));
        } catch (error) {
          console.error('Error fetching backlog data:', error);
          setBacklogMetrics({
            stories: { total: 0, byStatus: {}, byType: {} },
            tasks: { total: 0, byStatus: {}, byPriority: {} },
            defects: { total: 0, bySeverity: {}, byStatus: {} },
          });
          setMetrics(prev => ({
            ...prev,
            totalStories: 0,
            totalTasks: 0,
            totalDefects: 0,
          }));
        }

        try {
          projects = await projectService.getAllProjects();
          // Calculate project metrics
          const projectMetricsData = {
            total: projects.length,
            active: projects.filter(p => p.status === 'ACTIVE').length,
            completed: projects.filter(p => p.status === 'COMPLETED').length,
            onHold: projects.filter(p => p.status === 'ON_HOLD').length,
          };
          setProjectMetrics(projectMetricsData);

          // Calculate project progress
          const progressData = projects.map(project => ({
            name: project.name || 'Unnamed Project',
            completed: project.progress || 0,
            remaining: 100 - (project.progress || 0),
          }));
          setProjectProgress(progressData);

          // Set recent projects with safe date handling
          const sortedProjects = [...projects]
            .filter(p => p && p.createdAt) // Only include projects with valid dates
            .sort((a, b) => {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return isNaN(dateA.getTime()) || isNaN(dateB.getTime()) ? 0 : dateB - dateA;
            })
            .slice(0, 5);
          setRecentProjects(sortedProjects);

          // Update metrics with project data
          setMetrics(prev => ({
            ...prev,
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
          }));
        } catch (error) {
          console.error('Error fetching projects:', error);
          setProjectMetrics({
            total: 0,
            active: 0,
            completed: 0,
            onHold: 0,
          });
          setProjectProgress([]);
          setRecentProjects([]);
          setMetrics(prev => ({
            ...prev,
            totalProjects: 0,
            activeProjects: 0,
          }));
        }

        try {
          teams = await teamService.getAllTeams();
          // Calculate team metrics
          const teamMetricsData = {
            totalTeams: teams.length,
            totalMembers: teams.reduce((acc, team) => acc + (team.members?.length || 0), 0),
          };
          setTeamMetrics(teamMetricsData);
          // Update metrics with team data
          setMetrics(prev => ({
            ...prev,
            totalTeams: teams.length,
          }));
        } catch (error) {
          console.error('Error fetching teams:', error);
          setTeamMetrics({
            totalTeams: 0,
            totalMembers: 0,
          });
          setMetrics(prev => ({
            ...prev,
            totalTeams: 0,
          }));
        }

        try {
          sprints = await sprintService.getAllSprints();
          
          // Set upcoming sprints with safe date handling
          const upcomingSprintsData = sprints
            .filter(s => {
              if (!s || !s.startDate) return false;
              const startDate = new Date(s.startDate);
              return !isNaN(startDate.getTime()) && 
                     (s.status === 'PLANNED' || s.status === 'IN_PROGRESS');
            })
            .sort((a, b) => {
              const dateA = new Date(a.startDate);
              const dateB = new Date(b.startDate);
              return dateA - dateB;
            })
            .slice(0, 5)
            .map(sprint => ({
              ...sprint,
              projectName: projects.find(p => p.id === sprint.projectId)?.name || 'Unknown',
            }));
          setUpcomingSprints(upcomingSprintsData);

          // Update metrics with sprint data
          setMetrics(prev => ({
            ...prev,
            activeSprints: sprints.filter(s => s.status === 'IN_PROGRESS').length,
          }));

          // Calculate velocity data with safe date handling
          const last6Sprints = sprints
            .filter(s => {
              if (!s || !s.endDate || s.status !== 'COMPLETED') return false;
              const endDate = new Date(s.endDate);
              return !isNaN(endDate.getTime());
            })
            .sort((a, b) => {
              const dateA = new Date(a.endDate);
              const dateB = new Date(b.endDate);
              return dateB - dateA;
            })
            .slice(0, 6)
            .reverse();

          setVelocityData({
            labels: last6Sprints.map(s => s.name || 'Unnamed Sprint'),
            datasets: [{
              label: 'Story Points Completed',
              data: last6Sprints.map(s => s.completedPoints || 0),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            }],
          });
        } catch (error) {
          console.error('Error fetching sprints:', error);
          setUpcomingSprints([]);
          setMetrics(prev => ({
            ...prev,
            activeSprints: 0,
          }));
          setVelocityData({
            labels: [],
            datasets: [{
              label: 'Story Points Completed',
              data: [],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            }],
          });
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Reset all states to their default values
        setProjectMetrics({
          total: 0,
          active: 0,
          completed: 0,
          onHold: 0,
        });
        setTeamMetrics({
          totalTeams: 0,
          totalMembers: 0,
        });
        setUpcomingSprints([]);
        setProjectProgress([]);
        setMetrics({
          totalProjects: 0,
          activeProjects: 0,
          totalTeams: 0,
          activeSprints: 0,
        });
        setRecentProjects([]);
        setVelocityData({
          labels: [],
          datasets: [{
            label: 'Story Points Completed',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          }],
        });
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

  const getPriorityColor = (priority) => {
    const colors = {
      'Highest': 'error',
      'High': 'warning',
      'Medium': 'primary',
      'Low': 'info',
      'Lowest': 'default',
    };
    return colors[priority] || 'default';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': 'error',
      'High': 'error',
      'Medium': 'warning',
      'Low': 'info',
    };
    return colors[severity] || 'default';
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

        {/* Overview Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Projects
                </Typography>
                <Typography variant="h4">{metrics.totalProjects}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Teams
                </Typography>
                <Typography variant="h4">{metrics.totalTeams}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Sprints
                </Typography>
                <Typography variant="h4">{metrics.activeSprints}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Members
                </Typography>
                <Typography variant="h4">{teamMetrics.totalMembers}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Quick Actions</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Assignment />}
            component={RouterLink}
            to="/backlog"
          >
            Go to Backlog
          </Button>
        </Box>

        {/* Backlog Overview */}
        <Typography variant="h5" sx={{ mb: 2 }}>Backlog Overview</Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment sx={{ mr: 1 }} />
                  <Typography variant="h6">Stories</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>{backlogMetrics.stories.total}</Typography>
                <Typography variant="subtitle2" color="textSecondary">By Status</Typography>
                {Object.entries(backlogMetrics.stories.byStatus).map(([status, count]) => (
                  <Box key={status} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Chip
                      label={status}
                      size="small"
                      color={getStatusColor(status)}
                      sx={{ minWidth: 100 }}
                    />
                    <Typography>{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Task sx={{ mr: 1 }} />
                  <Typography variant="h6">Tasks</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>{backlogMetrics.tasks.total}</Typography>
                <Typography variant="subtitle2" color="textSecondary">By Priority</Typography>
                {Object.entries(backlogMetrics.tasks.byPriority).map(([priority, count]) => (
                  <Box key={priority} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Chip
                      label={priority}
                      size="small"
                      color={getPriorityColor(priority)}
                      sx={{ minWidth: 100 }}
                    />
                    <Typography>{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BugReport sx={{ mr: 1 }} />
                  <Typography variant="h6">Defects</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>{backlogMetrics.defects.total}</Typography>
                <Typography variant="subtitle2" color="textSecondary">By Severity</Typography>
                {Object.entries(backlogMetrics.defects.bySeverity).map(([severity, count]) => (
                  <Box key={severity} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Chip
                      label={severity}
                      size="small"
                      color={getSeverityColor(severity)}
                      sx={{ minWidth: 100 }}
                    />
                    <Typography>{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
                          {formatDate(sprint.startDate)}
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
                          <TableCell>{project.name || 'Unnamed Project'}</TableCell>
                          <TableCell>
                            <Chip
                              label={project.status || 'Unknown'}
                              size="small"
                              color={getStatusColor(project.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(project.createdAt)}
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