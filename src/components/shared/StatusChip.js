import React from 'react';
import { Chip } from '@mui/material';
import { STATUS_COLORS } from '../../utils/config';

const StatusChip = ({ status, size = 'small' }) => {
  if (!status) return <Chip label="Unknown" size={size} color="default" />;
  
  // Try to find a color for the status as is
  let color = STATUS_COLORS[status] || null;
  
  // If not found, try different case formats
  if (!color) {
    // Try uppercase
    color = STATUS_COLORS[status.toUpperCase?.()] || null;
    
    // Try title case (first letter uppercase)
    if (!color && typeof status === 'string') {
      const titleCase = status
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      color = STATUS_COLORS[titleCase] || 'default';
    }
  }
  
  // Final fallback
  color = color || 'default';
  
  // Format for display (capitalize first letter of each word)
  const displayStatus = typeof status === 'string'
    ? status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : String(status);
  
  return (
    <Chip
      label={displayStatus}
      size={size}
      color={color}
    />
  );
};

export default StatusChip; 