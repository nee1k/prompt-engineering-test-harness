import { createTheme } from '@mui/material/styles'

// Centralized MUI theme for consistent look and feel
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    success: {
      main: '#28a745',
    },
    warning: {
      main: '#ffc107',
    },
    error: {
      main: '#dc3545',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: 'medium',
      },
    },
    MuiSelect: {
      defaultProps: {
        fullWidth: true,
        size: 'medium',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      }
    }
  }
})

export default theme


