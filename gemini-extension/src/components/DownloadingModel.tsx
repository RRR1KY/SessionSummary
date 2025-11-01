import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Props for the DownloadingModel component.
 * @interface DownloadingModelProps
 */
interface DownloadingModelProps {
  /**
   * The current download progress as a percentage (0-100).
   * @type {number}
   */
  progress: number;
}

/**
 * A React functional component that displays a model downloading animation 
 * with a progress indicator.
 * @param {DownloadingModelProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered downloading model UI.
 */
const DownloadingModel: React.FC<DownloadingModelProps> = ({ progress }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography variant="h6">Downloading Model</Typography>
      <CircularProgress variant="determinate" value={progress} sx={{ my: 2 }} />
      <Typography variant="body2">{Math.round(progress)}%</Typography>
    </Box>
  );
};

export default DownloadingModel;