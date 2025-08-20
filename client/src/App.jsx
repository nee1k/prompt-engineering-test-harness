import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import TestRunForm from './components/TestRunForm'
import PromptSystemsList from './components/PromptSystemsList'
import TestSchedules from './components/TestSchedules'
import Alerts from './components/Alerts'


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

          
        </nav>

        <Routes>
          <Route path="/" element={<PromptSystemsList />} />
          <Route path="/test" element={<TestRunForm />} />
          <Route path="/schedules" element={<TestSchedules />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
