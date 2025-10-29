import { createTheme } from '@mui/material';

/**
 * Defines the light theme for the Material UI components.
 * This theme configures the color palette, typography, and component-specific styles
 * to provide a consistent light mode experience across the application.
 */
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00BFFF', // Accent color
    },
    background: {
      default: '#F5F5F5', // Light background
      paper: '#FFFFFF', // White paper background
    },
    text: {
      primary: '#212121', // Dark text
      secondary: '#616161', // Medium-dark text
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            backgroundColor: '#FFFFFF', // White background
          },
          '& .MuiInputBase-input': {
            color: '#212121', // Black text
          },
          '& .MuiInputLabel-root': {
            color: '#616161', // Dark muted label
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#BDBDBD', // Light grey border
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00BFFF', // Accent color on hover
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00BFFF', // Accent color on focus
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF', // White background
          border: '1px solid #E0E0E0', // Light border
          '&.Mui-expanded': {
            margin: 'auto',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        content: {
          margin: '12px 0',
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
        expandIconWrapper: {
          color: '#616161',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#212121',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '36px', // Adjust as needed
          color: '#616161',
        },
      },
    },
  },
});