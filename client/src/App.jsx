import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PromptSystemForm from './components/PromptSystemForm'
import TestRunForm from './components/TestRunForm'
import TestResults from './components/TestResults'
import PromptSystemsList from './components/PromptSystemsList'

function App() {
  const location = useLocation()

  return (
    <div>
      <header className="header">
        <h1>Emissary - Prompt System Monitor</h1>
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
            to="/results" 
            className={location.pathname === '/results' ? 'active' : ''}
          >
            Test Results
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<PromptSystemsList />} />
          <Route path="/create" element={<PromptSystemForm />} />
          <Route path="/test" element={<TestRunForm />} />
          <Route path="/results" element={<TestResults />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
