import React, { useState, useEffect } from 'react'
import axios from 'axios'

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
    } catch (error) {
      setError('Failed to fetch prompt systems')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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

  const getAverageScore = () => {
    if (historyModal.data.length === 0) return 0
    const total = historyModal.data.reduce((sum, run) => sum + (run.avg_score || 0), 0)
    return (total / historyModal.data.length).toFixed(2)
  }

  const getTotalRuns = () => {
    return historyModal.data.length
  }

  const getTrend = () => {
    if (historyModal.data.length < 2) return 'stable'
    const recent = historyModal.data.slice(-3)
    const older = historyModal.data.slice(-6, -3)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, run) => sum + (run.avg_score || 0), 0) / recent.length
    const olderAvg = older.reduce((sum, run) => sum + (run.avg_score || 0), 0) / older.length
    
    if (recentAvg > olderAvg + 0.1) return 'improving'
    if (recentAvg < olderAvg - 0.1) return 'declining'
    return 'stable'
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
    return <div className="loading">Loading prompt systems...</div>
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  return (
    <div className="card">
      <h2>Prompt Systems</h2>
      
      {promptSystems.length === 0 ? (
        <p>No prompt systems found. Create your first one!</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th>Model</th>
              <th>Template</th>
              <th>Variables</th>
              <th>Created (UTC)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promptSystems.map((system) => (
              <tr key={system.id}>
                <td><strong>{system.name}</strong></td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    backgroundColor: system.provider === 'openai' ? '#e3f2fd' : '#f3e5f5',
                    color: system.provider === 'openai' ? '#1976d2' : '#7b1fa2'
                  }}>
                    {system.provider === 'openai' ? 'OpenAI' : 'Ollama'}
                  </span>
                </td>
                <td>{system.model}</td>
                <td>
                  <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {system.template.substring(0, 100)}
                    {system.template.length > 100 && '...'}
                  </div>
                </td>
                <td>{JSON.parse(system.variables).join(', ')}</td>
                <td>{new Date(system.created_at).toLocaleString()}</td>
                <td>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => fetchHistory(system.id, system.name)}
                    disabled={historyLoading}
                  >
                    {historyLoading ? 'Loading...' : 'View History'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* History Modal */}
      {historyModal.show && (
        <div className="modal-overlay" onClick={() => setHistoryModal({ show: false, data: [], systemName: '', systemId: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh' }}>
            <div className="modal-header">
              <h3>Test History - {historyModal.systemName}</h3>
              <button 
                className="btn-close"
                onClick={() => setHistoryModal({ show: false, data: [], systemName: '', systemId: '' })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {historyModal.data.length === 0 ? (
                <p>No test history found for this prompt system.</p>
              ) : (
                <>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h3>Average Score</h3>
                      <div className="metric-value">{getAverageScore()}</div>
                    </div>
                    <div className="metric-card">
                      <h3>Total Runs</h3>
                      <div className="metric-value">{getTotalRuns()}</div>
                    </div>
                    <div className="metric-card">
                      <h3>Trend</h3>
                      <div className={`metric-value trend-${getTrend()}`}>
                        {getTrend().charAt(0).toUpperCase() + getTrend().slice(1)}
                      </div>
                    </div>
                  </div>

                  <div className="history-table">
                    <div className="table-header">
                      <h3>Recent Test Runs</h3>
                      <div className="table-controls">
                        <label>
                          Items per page:
                          <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                            className="form-control-sm"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    
                    <table>
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Score</th>
                          <th>Samples</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentHistory.map(run => (
                          <tr key={run.id}>
                            <td>{new Date(run.created_at).toLocaleString()}</td>
                            <td>{(run.avg_score || 0).toFixed(2)}</td>
                            <td>{run.total_samples || 0}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => fetchTestRunDetails(run.id)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="pagination-info">
                      <span>
                        Showing {startIndex + 1} to {Math.min(endIndex, historyModal.data.length)} of {historyModal.data.length} results
                      </span>
                    </div>
                    
                    <div className="pagination">
                      {renderPagination()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Run Details Modal */}
      {showDetailsModal && selectedRunDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Test Run Details</h3>
              <button 
                className="btn-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="test-run-info">
                <h4>Test Run Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Test Run ID:</label>
                    <span>{selectedRunDetails.test_run.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Timestamp:</label>
                    <span>{new Date(selectedRunDetails.test_run.created_at).toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <label>Average Score:</label>
                    <span>{(selectedRunDetails.test_run.avg_score || 0).toFixed(2)}</span>
                  </div>
                  <div className="info-item">
                    <label>Total Samples:</label>
                    <span>{selectedRunDetails.test_run.total_samples || 0}</span>
                  </div>
                  <div className="info-item">
                    <label>Prompt System:</label>
                    <span>{selectedRunDetails.test_run.prompt_system?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="test-results">
                <h4>Individual Results</h4>
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Sample</th>
                        <th>Input Variables</th>
                        <th>Expected Output</th>
                        <th>Predicted Output</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRunDetails.results.map((result, index) => (
                        <tr key={result.id}>
                          <td>{parseInt(result.sample_id) + 1}</td>
                          <td>
                            <pre className="json-display">
                              {JSON.stringify(JSON.parse(result.input_variables), null, 2)}
                            </pre>
                          </td>
                          <td className="output-cell">{result.expected_output}</td>
                          <td className="output-cell">{result.predicted_output}</td>
                          <td>
                            <span className={`score-badge ${result.score > 0.8 ? 'high' : result.score > 0.5 ? 'medium' : 'low'}`}>
                              {result.score.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptSystemsList
