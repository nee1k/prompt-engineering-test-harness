import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Stack, Typography, Dialog, DialogTitle, DialogContent, IconButton, Pagination, TextField, MenuItem, Alert, CircularProgress, Box } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PromptSystemForm from './PromptSystemForm'
import TestRunForm from './TestRunForm'

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function PromptSystemsList() {
  const [promptSystems, setPromptSystems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [historyModal, setHistoryModal] = useState({ show: false, data: [], systemName: '', systemId: '' })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedRunDetails, setSelectedRunDetails] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [templateModal, setTemplateModal] = useState({ show: false, template: '', systemName: '', variables: [] })
  const [systemMetrics, setSystemMetrics] = useState({})
  const [createSystemModal, setCreateSystemModal] = useState(false)
  const [testSystemModal, setTestSystemModal] = useState(false)

  useEffect(() => {
    fetchPromptSystems()
  }, [])

  const fetchPromptSystems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/prompt-systems/`)
      // Sort by creation date (latest first)
      const sortedSystems = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      setPromptSystems(sortedSystems)
      
      // Fetch metrics for each system
      for (const system of sortedSystems) {
        fetchSystemMetrics(system.id)
      }
    } catch (error) {
      setError('Failed to fetch prompt systems')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemMetrics = async (systemId) => {
    try {
      const response = await axios.get(`${API_BASE}/test-runs/${systemId}/history`)
      const history = response.data
      
      const avgScore = history.length > 0 
        ? (history.reduce((sum, run) => sum + (run.avg_score || 0), 0) / history.length).toFixed(2)
        : '0.00'
      
      const totalRuns = history.length
      
      let trend = 'stable'
      if (history.length >= 2) {
        const recent = history.slice(-3)
        const older = history.slice(-6, -3)
        
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((sum, run) => sum + (run.avg_score || 0), 0) / recent.length
          const olderAvg = older.reduce((sum, run) => sum + (run.avg_score || 0), 0) / older.length
          
          if (recentAvg > olderAvg + 0.1) trend = 'improving'
          else if (recentAvg < olderAvg - 0.1) trend = 'declining'
        }
      }
      
      setSystemMetrics(prev => ({
        ...prev,
        [systemId]: { avgScore, totalRuns, trend }
      }))
    } catch (error) {
      console.error('Error fetching metrics for system:', systemId, error)
      setSystemMetrics(prev => ({
        ...prev,
        [systemId]: { avgScore: '0.00', totalRuns: 0, trend: 'stable' }
      }))
    }
  }

  const getSystemMetrics = (systemId) => {
    return systemMetrics[systemId] || { avgScore: '0.00', totalRuns: 0, trend: 'stable' }
  }

  // Pagination functions for main systems list
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = promptSystems.slice(indexOfFirstItem, indexOfLastItem)
  const totalPagesMain = Math.ceil(promptSystems.length / itemsPerPage)

  const handlePageChangeMain = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleItemsPerPageChangeMain = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const fetchHistory = async (promptSystemId, systemName) => {
    setHistoryLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/test-runs/${promptSystemId}/history`)
      setHistoryModal({ 
        show: true, 
        data: response.data, 
        systemName: systemName,
        systemId: promptSystemId
      })
      setCurrentPage(1) // Reset to first page
    } catch (error) {
      console.error('Error fetching history:', error)
      alert('Failed to fetch test history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchTestRunDetails = async (testRunId) => {
    try {
      const response = await axios.get(`${API_BASE}/test-runs/${testRunId}`)
      setSelectedRunDetails(response.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error fetching test run details:', error)
      alert('Failed to fetch test run details')
    }
  }



  // Pagination calculations
  const totalPages = Math.ceil(historyModal.data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentHistory = historyModal.data.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const showTemplate = (template, systemName, variables) => {
    setTemplateModal({ show: true, template, systemName, variables })
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          className="btn btn-sm btn-secondary"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          ← Previous
        </button>
      )
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key="1"
          className="btn btn-sm btn-secondary"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>)
      }
    }

    // Visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      )
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>)
      }
      pages.push(
        <button
          key={totalPages}
          className="btn btn-sm btn-secondary"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      )
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          className="btn btn-sm btn-secondary"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next →
        </button>
      )
    }

    return pages
  }

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading prompt systems...</Typography>
      </Stack>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <div className="prompt-systems-container">
      
      {promptSystems.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>No Prompt Systems Found</Typography>
            <Typography color="text.secondary">Create your first prompt system to get started with testing and evaluation.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Prompt Systems" />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Metrics</TableCell>
                    <TableCell width={160}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
              {currentItems.map((system) => (
                    <TableRow key={system.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{system.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={system.provider === 'openai' ? 'OpenAI' : 'Ollama'} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={system.model} variant="outlined" />
                      </TableCell>
                      <TableCell>{new Date(system.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Stack alignItems="center">
                            <Typography variant="caption">Score</Typography>
                            <Typography fontWeight={600}>{getSystemMetrics(system.id).avgScore}</Typography>
                          </Stack>
                          <Stack alignItems="center">
                            <Typography variant="caption">Runs</Typography>
                            <Typography fontWeight={600}>{getSystemMetrics(system.id).totalRuns}</Typography>
                          </Stack>
                          <Stack alignItems="center">
                            <Typography variant="caption">Trend</Typography>
                            <Typography fontWeight={600}>{getSystemMetrics(system.id).trend}</Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button 
                            variant="outlined"
                            size="small"
                        onClick={() => showTemplate(system.template, system.name, JSON.parse(system.variables))}
                        title="View Template"
                      >
                        Template
                          </Button>
                          <Button 
                            variant="outlined"
                            size="small"
                        onClick={() => fetchHistory(system.id, system.name)}
                        disabled={historyLoading}
                        title="View History"
                      >
                        History
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPagesMain > 1 && (
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography color="text.secondary">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, promptSystems.length)} of {promptSystems.length} systems
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    select
                    size="small"
                    label="Items per page"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChangeMain(parseInt(e.target.value))}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </TextField>
                  <Pagination
                    color="primary"
                    count={totalPagesMain}
                    page={currentPage}
                    onChange={(_, page) => handlePageChangeMain(page)}
                  />
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateSystemModal(true)}
          sx={{ mr: 2 }}
        >
          Create Prompt System
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setTestSystemModal(true)}
        >
          Test Prompt System
        </Button>
      </div>

      {/* History Modal */}
      <Dialog
        open={historyModal.show}
        onClose={() => setHistoryModal({ show: false, data: [], systemName: '', systemId: '' })}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Test History - {historyModal.systemName}
          <IconButton
            aria-label="close"
                onClick={() => setHistoryModal({ show: false, data: [], systemName: '', systemId: '' })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
              {historyModal.data.length === 0 ? (
            <Typography>No test history found for this prompt system.</Typography>
              ) : (
                <>
              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Items per page"
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </TextField>
              </Stack>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Samples</TableCell>
                      <TableCell width={120}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                        {currentHistory.map(run => (
                      <TableRow key={run.id}>
                        <TableCell>{new Date(run.created_at).toLocaleString()}</TableCell>
                        <TableCell>{(run.avg_score || 0).toFixed(2)}</TableCell>
                        <TableCell>{run.total_samples || 0}</TableCell>
                        <TableCell>
                          <Button size="small" variant="contained" onClick={() => fetchTestRunDetails(run.id)}>
                                View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography color="text.secondary">
                        Showing {startIndex + 1} to {Math.min(endIndex, historyModal.data.length)} of {historyModal.data.length} results
                </Typography>
                <Pagination
                  color="primary"
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => handlePageChange(page)}
                />
              </Stack>
                </>
              )}
        </DialogContent>
      </Dialog>

      {/* Test Run Details Modal */}
      <Dialog open={showDetailsModal && !!selectedRunDetails} onClose={() => setShowDetailsModal(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Test Run Details
          <IconButton aria-label="close" onClick={() => setShowDetailsModal(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRunDetails && (
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Test Run Information</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <div>
                      <Typography variant="caption" color="text.secondary">Test Run ID</Typography>
                      <Typography>{selectedRunDetails.test_run.id}</Typography>
            </div>
                    <div>
                      <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                      <Typography>{new Date(selectedRunDetails.test_run.created_at).toLocaleString()}</Typography>
                  </div>
                    <div>
                      <Typography variant="caption" color="text.secondary">Average Score</Typography>
                      <Typography>{(selectedRunDetails.test_run.avg_score || 0).toFixed(2)}</Typography>
                  </div>
                    <div>
                      <Typography variant="caption" color="text.secondary">Total Samples</Typography>
                      <Typography>{selectedRunDetails.test_run.total_samples || 0}</Typography>
                  </div>
                    <div>
                      <Typography variant="caption" color="text.secondary">Prompt System</Typography>
                      <Typography>{selectedRunDetails.test_run.prompt_system?.name || 'Unknown'}</Typography>
                  </div>
                  </Box>
                </CardContent>
              </Card>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sample</TableCell>
                      <TableCell>Input Variables</TableCell>
                      <TableCell>Expected Output</TableCell>
                      <TableCell>Predicted Output</TableCell>
                      <TableCell>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRunDetails.results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{parseInt(result.sample_id) + 1}</TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <pre style={{ margin: 0 }}>{JSON.stringify(JSON.parse(result.input_variables), null, 2)}</pre>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260, wordBreak: 'break-word' }}>{result.expected_output}</TableCell>
                        <TableCell sx={{ maxWidth: 260, wordBreak: 'break-word' }}>{result.predicted_output}</TableCell>
                        <TableCell>{result.score.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      <Dialog open={templateModal.show} onClose={() => setTemplateModal({ show: false, template: '', systemName: '', variables: [] })} fullWidth maxWidth="sm">
        <DialogTitle>
          Template - {templateModal.systemName}
          <IconButton aria-label="close" onClick={() => setTemplateModal({ show: false, template: '', systemName: '', variables: [] })} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>Variables</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {templateModal.variables.map((variable, index) => (
              <Chip key={index} label={variable} color="primary" size="small" />
            ))}
          </Stack>
          <Typography variant="subtitle2" gutterBottom>Template</Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto', fontFamily: 'monospace' }}>
            {templateModal.template}
          </Paper>
        </DialogContent>
      </Dialog>

      {/* Create System Modal */}
      <Dialog open={createSystemModal} onClose={() => setCreateSystemModal(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Create Prompt System
          <IconButton aria-label="close" onClick={() => setCreateSystemModal(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <PromptSystemForm 
            onSuccess={() => {
              setCreateSystemModal(false)
              fetchPromptSystems()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Test System Modal */}
      <Dialog open={testSystemModal} onClose={() => setTestSystemModal(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          Test a System
          <IconButton aria-label="close" onClick={() => setTestSystemModal(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TestRunForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PromptSystemsList
