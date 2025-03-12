import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Rating,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, differenceInDays } from 'date-fns';
import storyService from '../services/storyService';
import sprintService from '../services/sprintService';
import teamService from '../services/teamService';
import defectService from '../services/defectService';

const Metrics = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [deliveryMetrics, setDeliveryMetrics] = useState({
    velocity: {
      average: 0,
      trend: [],
    },
    cycleTime: {
      average: 0,
      byType: {},
      trend: [],
    },
    plannedVsDelivered: {
      completion: 0,
      trend: [],
    },
  });

  const [qualityMetrics, setQualityMetrics] = useState({
    defectDensity: {
      overall: 0,
      byModule: [],
    },
    defectLeakage: {
      rate: 0,
      trend: [],
    },
    changeFailure: {
      rate: 0,
      trend: [],
    },
  });

  const [teamHealthMetrics, setTeamHealthMetrics] = useState({
    blockedItems: {
      count: 0,
      byReason: [],
    },
    teamHappiness: {
      current: 0,
      trend: [],
    },
    churnRate: {
      current: 0,
      trend: [],
    },
  });

  useEffect(() => {
    fetchMetricsData();
  }, []);

  const fetchMetricsData = async () => {
    try {
      setLoading(true);
      const [sprints, stories, teams, defects] = await Promise.all([
        sprintService.getAllSprints(),
        storyService.getAllStories(),
        teamService.getAllTeams(),
        defectService.getAllDefects(),
      ]);

      // Calculate Delivery & Efficiency Metrics
      const deliveryData = calculateDeliveryMetrics(sprints, stories);
      setDeliveryMetrics(deliveryData);

      // Calculate Quality & Stability Metrics
      const qualityData = calculateQualityMetrics(defects, stories);
      setQualityMetrics(qualityData);

      // Calculate Team Health Metrics
      const teamHealthData = calculateTeamHealthMetrics(stories, teams);
      setTeamHealthMetrics(teamHealthData);

    } catch (error) {
      console.error('Error fetching metrics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeliveryMetrics = (sprints, stories) => {
    // Calculate Velocity
    const velocityData = sprints.map(sprint => ({
      sprint: sprint.name,
      points: sprint.completedPoints || 0,
      date: format(new Date(sprint.endDate), 'MMM d'),
    }));

    const averageVelocity = velocityData.length > 0
      ? Math.round(velocityData.reduce((acc, sprint) => acc + sprint.points, 0) / velocityData.length)
      : 0;

    // Calculate Cycle Time
    const cycleTimeData = stories
      .filter(story => story.status === 'COMPLETED')
      .map(story => {
        const days = differenceInDays(
          new Date(story.completedDate),
          new Date(story.startDate)
        );
        return {
          type: story.type,
          days: days > 0 ? days : 1,
        };
      });

    const averageCycleTime = cycleTimeData.length > 0
      ? Math.round(cycleTimeData.reduce((acc, item) => acc + item.days, 0) / cycleTimeData.length)
      : 0;

    // Calculate Planned vs Delivered
    const completionData = sprints.map(sprint => {
      const planned = sprint.plannedPoints || 0;
      const completed = sprint.completedPoints || 0;
      return {
        sprint: sprint.name,
        percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0,
        date: format(new Date(sprint.endDate), 'MMM d'),
      };
    });

    const averageCompletion = completionData.length > 0
      ? Math.round(completionData.reduce((acc, sprint) => acc + sprint.percentage, 0) / completionData.length)
      : 0;

    return {
      velocity: {
        average: averageVelocity,
        trend: velocityData,
      },
      cycleTime: {
        average: averageCycleTime,
        byType: groupCycleTimeByType(cycleTimeData),
        trend: cycleTimeData,
      },
      plannedVsDelivered: {
        completion: averageCompletion,
        trend: completionData,
      },
    };
  };

  const calculateQualityMetrics = (defects, stories) => {
    // Calculate Defect Density
    const moduleDefects = defects.reduce((acc, defect) => {
      acc[defect.module] = (acc[defect.module] || 0) + 1;
      return acc;
    }, {});

    const totalFeatures = stories.length;
    const defectDensity = totalFeatures > 0
      ? Math.round((defects.length / totalFeatures) * 100) / 100
      : 0;

    // Calculate Defect Leakage
    const productionDefects = defects.filter(d => d.environment === 'PRODUCTION');
    const leakageRate = defects.length > 0
      ? Math.round((productionDefects.length / defects.length) * 100)
      : 0;

    // Calculate Change Failure Rate
    const failedDeployments = defects.filter(d => d.type === 'DEPLOYMENT_FAILURE').length;
    const totalDeployments = stories.filter(s => s.status === 'DEPLOYED').length;
    const failureRate = totalDeployments > 0
      ? Math.round((failedDeployments / totalDeployments) * 100)
      : 0;

    return {
      defectDensity: {
        overall: defectDensity,
        byModule: Object.entries(moduleDefects).map(([module, count]) => ({
          name: module,
          count,
        })),
      },
      defectLeakage: {
        rate: leakageRate,
        trend: groupDefectsByTimeframe(productionDefects),
      },
      changeFailure: {
        rate: failureRate,
        trend: groupFailuresByTimeframe(defects.filter(d => d.type === 'DEPLOYMENT_FAILURE')),
      },
    };
  };

  const calculateTeamHealthMetrics = (stories, teams) => {
    // Calculate Blocked Items
    const blockedStories = stories.filter(story => story.status === 'BLOCKED');
    const blockReasons = blockedStories.reduce((acc, story) => {
      acc[story.blockReason] = (acc[story.blockReason] || 0) + 1;
      return acc;
    }, {});

    // Calculate Team Happiness (assuming we have happiness scores in team data)
    const happinessScores = teams.map(team => ({
      team: team.name,
      score: team.happinessScore || 0,
    }));

    const averageHappiness = happinessScores.length > 0
      ? Math.round(happinessScores.reduce((acc, item) => acc + item.score, 0) / happinessScores.length)
      : 0;

    // Calculate Churn Rate
    const churnedStories = stories.filter(story => 
      story.status === 'REMOVED' || story.status === 'REPRIORITIZED'
    );
    const churnRate = stories.length > 0
      ? Math.round((churnedStories.length / stories.length) * 100)
      : 0;

    return {
      blockedItems: {
        count: blockedStories.length,
        byReason: Object.entries(blockReasons).map(([reason, count]) => ({
          name: reason,
          count,
        })),
      },
      teamHappiness: {
        current: averageHappiness,
        trend: happinessScores,
      },
      churnRate: {
        current: churnRate,
        trend: groupChurnByTimeframe(churnedStories),
      },
    };
  };

  const groupCycleTimeByType = (cycleTimeData) => {
    const grouped = cycleTimeData.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item.days);
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, days]) => ({
      type,
      average: Math.round(days.reduce((acc, d) => acc + d, 0) / days.length),
    }));
  };

  const groupDefectsByTimeframe = (defects) => {
    // Group defects by week/month for trend analysis
    return defects.reduce((acc, defect) => {
      const date = format(new Date(defect.createdAt), 'MMM d');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  };

  const groupFailuresByTimeframe = (failures) => {
    // Similar to groupDefectsByTimeframe but for deployment failures
    return failures.reduce((acc, failure) => {
      const date = format(new Date(failure.createdAt), 'MMM d');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  };

  const groupChurnByTimeframe = (churnedStories) => {
    // Group churned stories by week/month for trend analysis
    return churnedStories.reduce((acc, story) => {
      const date = format(new Date(story.updatedAt), 'MMM d');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        <Typography variant="h4" gutterBottom>
          Engineering Metrics Dashboard
        </Typography>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Delivery & Efficiency" />
          <Tab label="Quality & Stability" />
          <Tab label="Team Health" />
        </Tabs>

        {/* Delivery & Efficiency Metrics */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Velocity Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sprint Velocity
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="primary">
                      {deliveryMetrics.velocity.average}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Story Points per Sprint
                    </Typography>
                  </Box>
                  <Box sx={{ height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={deliveryMetrics.velocity.trend}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="points" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Cycle Time Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cycle Time
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="primary">
                      {deliveryMetrics.cycleTime.average}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Days to Complete
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Avg Days</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {deliveryMetrics.cycleTime.byType.map((item) => (
                          <TableRow key={item.type}>
                            <TableCell>{item.type}</TableCell>
                            <TableCell align="right">{item.average}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Planned vs Delivered Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Planned vs Delivered
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="primary">
                      {deliveryMetrics.plannedVsDelivered.completion}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Completion Rate
                    </Typography>
                  </Box>
                  <Box sx={{ height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={deliveryMetrics.plannedVsDelivered.trend}>
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="percentage" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Quality & Stability Metrics */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Defect Density Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Defect Density
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="error">
                      {qualityMetrics.defectDensity.overall}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Defects per Feature
                    </Typography>
                  </Box>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={qualityMetrics.defectDensity.byModule}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                        >
                          {qualityMetrics.defectDensity.byModule.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Defect Leakage Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Defect Leakage Rate
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="error">
                      {qualityMetrics.defectLeakage.rate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Production Defects
                    </Typography>
                  </Box>
                  <Box sx={{ height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(qualityMetrics.defectLeakage.trend).map(([date, count]) => ({ date, count }))}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ff4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Change Failure Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Change Failure Rate
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="error">
                      {qualityMetrics.changeFailure.rate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Failed Deployments
                    </Typography>
                  </Box>
                  <Box sx={{ height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(qualityMetrics.changeFailure.trend).map(([date, count]) => ({ date, count }))}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ff8800" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Team Health Metrics */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            {/* Blocked Items Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Blocked Work Items
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="warning.main">
                      {teamHealthMetrics.blockedItems.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Currently Blocked Items
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Reason</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {teamHealthMetrics.blockedItems.byReason.map((item) => (
                          <TableRow key={item.name}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Team Happiness Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Happiness Score
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="primary">
                      {teamHealthMetrics.teamHappiness.current}/5
                    </Typography>
                    <Rating
                      value={teamHealthMetrics.teamHappiness.current}
                      readOnly
                      precision={0.5}
                      size="large"
                    />
                  </Box>
                  <Box sx={{ height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={teamHealthMetrics.teamHappiness.trend}>
                        <XAxis dataKey="team" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Churn Rate Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Churn Rate
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" color="error">
                      {teamHealthMetrics.churnRate.current}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stories Removed or Reprioritized
                    </Typography>
                  </Box>
                  <Box sx={{ height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(teamHealthMetrics.churnRate.trend).map(([date, count]) => ({ date, count }))}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ff4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Metrics; 