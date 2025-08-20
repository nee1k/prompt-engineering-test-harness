import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PromptSystemForm from './components/PromptSystemForm'
import TestRunForm from './components/TestRunForm'
import PromptSystemsList from './components/PromptSystemsList'
import TestSchedules from './components/TestSchedules'
import Alerts from './components/Alerts'
import TestHistory from './components/TestHistory'

function App() {
  const location = useLocation()

  return (
    <div>
      <header className="header">
        <h1>Prompt Engineering Test Harness</h1>
      </header>
      
      <div className="container">
        <nav className="nav">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            Prompt Systems
          </Link>
          <Link 
            to="/create" 
            className={location.pathname === '/create' ? 'active' : ''}
          >
            Create System
          </Link>
          <Link 
            to="/test" 
            className={location.pathname === '/test' ? 'active' : ''}
          >
            Run Test
          </Link>
          <Link 
            to="/schedules" 
            className={location.pathname === '/schedules' ? 'active' : ''}
          >
            Schedules
          </Link>
          <Link 
            to="/alerts" 
            className={location.pathname === '/alerts' ? 'active' : ''}
          >
            Alerts
          </Link>
          <Link 
            to="/history" 
            className={location.pathname === '/history' ? 'active' : ''}
          >
            History
          </Link>
          
        </nav>

        <Routes>
          <Route path="/" element={<PromptSystemsList />} />
          <Route path="/create" element={<PromptSystemForm />} />
          <Route path="/test" element={<TestRunForm />} />
          <Route path="/schedules" element={<TestSchedules />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/history" element={<TestHistory />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
