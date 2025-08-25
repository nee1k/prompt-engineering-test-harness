import { Grid, Paper, Typography } from '@mui/material'

export default function DashboardHome() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Welcome</Typography>
          <Typography variant="body2">Use the navigation to access CRUD tables and features.</Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}


