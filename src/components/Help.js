import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
} from '@mui/material';
import {
  FaArrowLeft,
  FaQuestionCircle,
  FaCalendarAlt,
  FaUserClock,
  FaBell,
  FaCog,
  FaEnvelope,
  FaPhone,
  FaChevronDown,
  FaUsers,
  FaChartLine,
  FaDatabase,
  FaBusinessTime
} from 'react-icons/fa';
import './Help.css';

const Help = () => {
  console.log('Help component rendered');
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Handle scrolling to section when component mounts or location state changes
    if (location.state?.section) {
      const element = document.getElementById(location.state.section);
      if (element) {
        setTimeout(() => {
          const headerOffset = 70; // Adjust this value based on your header height
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [location.state]);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const mainFeatures = [
    {
      title: "Appointments Dashboard",
      icon: <FaCalendarAlt />,
      content: "Central hub for managing all appointments. View, filter, and export appointment data.",
      route: "/appointments"
    },
    {
      title: "Schedule Management",
      icon: <FaUserClock />,
      content: "Create and manage appointments with an intuitive scheduling interface.",
      route: "/schedule-appointment"
    },
    {
      title: "Customer CRM",
      icon: <FaUsers />,
      content: "Manage customer relationships, view history, and track interactions.",
      route: "/crm"
    },
    {
      title: "Analytics & Reports",
      icon: <FaChartLine />,
      content: "Access business metrics, appointment trends, and performance insights.",
      route: "/analytics"
    }
  ];

  const faqs = [
    {
      question: "How do I schedule an appointment?",
      answer: "1. Click 'Schedule Appointment' on the dashboard\n2. Select the date and time\n3. Enter customer details\n4. Choose appointment type\n5. Add any notes or special requirements\n6. Click 'Schedule' to confirm"
    },
    {
      question: "How do I manage customer information?",
      answer: "Access the CRM section to view and manage customer profiles. You can add new customers, update contact information, and view appointment history."
    },
    {
      question: "How do I view business analytics?",
      answer: "Navigate to the Analytics section to view various reports including appointment trends, customer insights, and location performance metrics."
    },
    {
      question: "How do I export data?",
      answer: "Use the export feature in the Appointments Dashboard to download data in CSV format. You can filter the data before exporting to get specific information."
    },
    {
      question: "How do I customize my settings?",
      answer: "Access Settings through the quick actions menu to customize:\n- Display preferences\n- Notification settings\n- Business information\n- Default appointment durations"
    },
    {
      question: "How do I use the calendar view?",
      answer: "The calendar provides daily, weekly, and monthly views of your appointments. Click on any time slot to schedule a new appointment or click on an existing appointment to view details."
    }
  ];

  const quickTips = [
    {
      title: "Data Management",
      icon: <FaDatabase />,
      tips: [
        "Regular data exports for backup",
        "Update customer information promptly",
        "Use filters to find specific appointments"
      ]
    },
    {
      title: "Business Operations",
      icon: <FaBusinessTime />,
      tips: [
        "Set business hours in settings",
        "Configure notification preferences",
        "Review analytics weekly"
      ]
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
          aria-label="back to dashboard"
        >
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h5">Help Center</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }} id="help-main">
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Welcome to the Success Toolkit Help Center
          </Typography>
          <Typography variant="body1">
            Get started with guides and answers to common questions about our business management platform.
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Main Features</Typography>
          <Grid container spacing={3} className="main-features-grid">
            {mainFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper 
                  elevation={0} 
                  className="help-feature-card"
                  onClick={() => navigate(feature.route)}
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ color: 'primary.main', mr: 1 }}>{feature.icon}</Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {feature.content}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }} id="faqs">
        Frequently Asked Questions
      </Typography>
      {faqs.map((faq, index) => (
        <Accordion
          key={index}
          expanded={expanded === `panel${index}`}
          onChange={handleChange(`panel${index}`)}
          sx={{ mb: 1, '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            expandIcon={<FaChevronDown />}
            sx={{ '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FaQuestionCircle style={{ marginRight: '12px', color: '#1976d2' }} />
              <Typography>{faq.question}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography 
              color="text.secondary"
              sx={{ whiteSpace: 'pre-line' }}
            >
              {faq.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }} id="quick-tips">
          Quick Tips
        </Typography>
        <Grid container spacing={3}>
          {quickTips.map((section, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: 'primary.main', mr: 1 }}>{section.icon}</Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {section.title}
                  </Typography>
                </Box>
                <List dense>
                  {section.tips.map((tip, tipIndex) => (
                    <ListItem className="quick-tip-item" key={tipIndex}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <FaChevronDown style={{ fontSize: '0.8rem', color: '#1976d2' }} />
                      </ListItemIcon>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Paper elevation={0} sx={{ 
          borderRadius: 2, 
          mt: 4, 
          p: 3, 
          bgcolor: '#0D47A1',
          color: 'white',
          textAlign: 'center'
        }}>
        <Typography variant="h6" sx={{ mb: 2 }} id="contact-support">
          Need Additional Support?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Our support team is here to help you succeed:
        </Typography>
        <List sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          width: '100%',
          p: 0
        }}>
          <ListItem sx={{ 
            justifyContent: 'center', 
            pb: 1,
            width: 'auto',
            display: 'inline-flex'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaEnvelope style={{ marginRight: '8px' }} />
              <Link 
                href="mailto:support@boaztestdemo.com" 
                className="support-link" 
                sx={{ 
                  color: 'white',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                support@boaztestdemo.com
              </Link>
            </Box>
          </ListItem>
          <ListItem sx={{ 
            justifyContent: 'center', 
            pt: 1,
            width: 'auto',
            display: 'inline-flex'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaPhone style={{ marginRight: '8px' }} />
              <Link 
                href="tel:9999999999" 
                className="support-link" 
                sx={{ 
                  color: 'white',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                (999) 999-9999
              </Link>
            </Box>
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default Help; 