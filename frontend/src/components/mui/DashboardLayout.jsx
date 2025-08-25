import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'

export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Prompt Engineering Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Container sx={{ mt: 2 }}>
        {children}
      </Container>
    </Box>
  )
}


