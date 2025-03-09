import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, MenuItem, IconButton } from '@mui/material';
import { FaQuestionCircle, FaHome } from 'react-icons/fa';
import './Header.css';

const Header = ({ username, setAuthToken }) => {
  const navigate = useNavigate();
  const [helpAnchorEl, setHelpAnchorEl] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken('');
    navigate('/login');
  };

  const handleHelpClick = (event) => {
    setHelpAnchorEl(event.currentTarget);
  };

  const handleHelpClose = () => {
    setHelpAnchorEl(null);
  };

  const navigateToHelp = (section) => {
    handleHelpClose();
    
    // Navigate to help page with state containing the target section
    navigate('/help', {
      state: { section: section.replace('#', '') }
    });
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/dashboard" className="dashboard-link">
          <FaHome size={20} style={{ color: 'white' }} />
          <span style={{ color: 'white' }}>Dashboard</span>
        </Link>
        <Link to="/dashboard" className="header-title">
          Back Office Applications ZoneOS
        </Link>
        <div className="user-section">
          <IconButton
            onClick={handleHelpClick}
            sx={{ 
              color: 'white',
              padding: '4px',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.1)' 
              }
            }}
          >
            <FaQuestionCircle size={20} />
          </IconButton>
          <Menu
            anchorEl={helpAnchorEl}
            open={Boolean(helpAnchorEl)}
            onClose={handleHelpClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                minWidth: 220,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  margin: '2px 8px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#333',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }
              }
            }}
          >
            <MenuItem onClick={() => navigateToHelp('')}>
              <FaQuestionCircle style={{ marginRight: '10px', fontSize: '16px', color: '#1976d2' }} />
              Help Center Overview
            </MenuItem>
            <MenuItem onClick={() => navigateToHelp('#faqs')}>
              <FaQuestionCircle style={{ marginRight: '10px', fontSize: '16px', color: '#1976d2' }} />
              Frequently Asked Questions
            </MenuItem>
            <MenuItem onClick={() => navigateToHelp('#quick-tips')}>
              <FaQuestionCircle style={{ marginRight: '10px', fontSize: '16px', color: '#1976d2' }} />
              Quick Tips & Guides
            </MenuItem>
            <MenuItem onClick={() => navigateToHelp('#contact-support')}>
              <FaQuestionCircle style={{ marginRight: '10px', fontSize: '16px', color: '#1976d2' }} />
              Contact Support
            </MenuItem>
          </Menu>
          {username && (
            <>
              <span className="username">Welcome, {username}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 