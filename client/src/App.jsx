import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PromptSystemsList from './components/PromptSystemsList'
import TestSchedules from './components/TestSchedules'
import CompareModels from './components/CompareModels'
import PromptOptimizer from './components/PromptOptimizer'


function App() {
  const location = useLocation()

  return (
    <div>
      <header className="header" style={{ marginBottom: '2.5rem' }}>
        <h1>Prompt Engineering Test Harness</h1>
      </header>
      
      <div className="container">
        <nav
          className="nav"
          style={{
            display: 'flex',
            gap: '2.5rem',
            marginBottom: '2.5rem',
            justifyContent: 'center',
            fontSize: '1.15rem',
            fontWeight: 500,
            letterSpacing: '0.01em'
          }}
        >
          <Link
            to="/"
            className={location.pathname === '/' ? 'active' : ''}
            style={{ padding: '0.5rem 1.5rem' }}
          >
            Prompt Systems
          </Link>

          <Link
            to="/schedules"
            className={location.pathname === '/schedules' ? 'active' : ''}
            style={{ padding: '0.5rem 1.5rem' }}
          >
            Test Schedules
          </Link>

          <Link
            to="/compare-models"
            className={location.pathname === '/compare-models' ? 'active' : ''}
            style={{ padding: '0.5rem 1.5rem' }}
          >
            Compare Models
          </Link>

          <Link
            to="/prompt-optimizer"
            className={location.pathname === '/prompt-optimizer' ? 'active' : ''}
            style={{ padding: '0.5rem 1.5rem' }}
          >
            Prompt Optimizer
          </Link>
        </nav>

        <div style={{ marginTop: '2.5rem' }}>
          <Routes>
            <Route path="/" element={<PromptSystemsList />} />
            <Route path="/schedules" element={<TestSchedules />} />
            <Route path="/compare-models" element={<CompareModels />} />
            <Route path="/prompt-optimizer" element={<PromptOptimizer />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
