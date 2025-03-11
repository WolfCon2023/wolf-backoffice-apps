import React from 'react';
import { Chip } from '@mui/material';
import { STATUS_COLORS } from '../../utils/config';

const StatusChip = ({ status, size = 'small' }) => {
  const color = STATUS_COLORS[status] || 'default';
  
  return (
    <Chip
      label={status}
      size={size}
      color={color}
      sx={{
        '& .MuiChip-label': {
          textTransform: 'capitalize',
        },
      }}
    />
  );
};

export default StatusChip; 