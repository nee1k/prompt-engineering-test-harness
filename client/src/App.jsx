import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PromptSystemsList from './components/PromptSystemsList'
import TestSchedules from './components/TestSchedules'


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
            to="/schedules" 
            className={location.pathname === '/schedules' ? 'active' : ''}
          >
            Test Schedules
          </Link>

          
        </nav>

        <Routes>
          <Route path="/" element={<PromptSystemsList />} />
          <Route path="/schedules" element={<TestSchedules />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
