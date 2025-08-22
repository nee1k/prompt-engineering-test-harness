import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PromptSystemsList from './components/PromptSystemsList'
import TestSchedules from './components/TestSchedules'
import CompareModels from './components/CompareModels'
import SelfHealingOptimization from './components/SelfHealingOptimization'


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

          <Link 
            to="/compare-models" 
            className={location.pathname === '/compare-models' ? 'active' : ''}
          >
            Compare Models
          </Link>

          <Link 
            to="/self-healing" 
            className={location.pathname === '/self-healing' ? 'active' : ''}
          >
            Self-Healing
          </Link>

        </nav>

        <Routes>
          <Route path="/" element={<PromptSystemsList />} />
          <Route path="/schedules" element={<TestSchedules />} />
          <Route path="/compare-models" element={<CompareModels />} />
          <Route path="/self-healing" element={<SelfHealingOptimization />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
