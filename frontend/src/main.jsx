import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import DashboardLayout from './components/mui/DashboardLayout'
import DashboardHome from './components/mui/DashboardHome'
import CrudTable from './components/mui/CrudTable'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CssBaseline />
      <DashboardLayout>
        <Routes>
          <Route path='/' element={<DashboardHome />} />
          <Route path='/crud' element={<CrudTable />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  </React.StrictMode>,
)
