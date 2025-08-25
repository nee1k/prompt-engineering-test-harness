import React from 'react'
import { Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box
} from '@mui/material'
import PromptSystemsList from './components/PromptSystemsList'
import TestSchedules from './components/TestSchedules'
import CompareModels from './components/CompareModels'
import PromptOptimizer from './components/PromptOptimizer'


function App() {
  const location = useLocation()

  return (
    <div>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Prompt Engineering Test Harness
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color={location.pathname === '/' ? 'secondary' : 'inherit'}
              component={RouterLink}
              to="/"
            >
              Prompt Systems
            </Button>
            <Button
              color={location.pathname === '/schedules' ? 'secondary' : 'inherit'}
              component={RouterLink}
              to="/schedules"
            >
              Test Schedules
            </Button>
            <Button
              color={location.pathname === '/compare-models' ? 'secondary' : 'inherit'}
              component={RouterLink}
              to="/compare-models"
            >
              Compare Models
            </Button>
            <Button
              color={location.pathname === '/prompt-optimizer' ? 'secondary' : 'inherit'}
              component={RouterLink}
              to="/prompt-optimizer"
            >
              Prompt Optimizer
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<PromptSystemsList />} />
          <Route path="/schedules" element={<TestSchedules />} />
          <Route path="/compare-models" element={<CompareModels />} />
          <Route path="/prompt-optimizer" element={<PromptOptimizer />} />
        </Routes>
      </Container>
    </div>
  )
}

export default App
