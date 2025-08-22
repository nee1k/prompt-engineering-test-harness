import React, { useState, useEffect } from 'react'
import axios from 'axios'
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
    return <div className="loading">Loading prompt systems...</div>
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  return (
    <div className="prompt-systems-container">
      
      {promptSystems.length === 0 ? (
        <div className="empty-state">
          <h3>No Prompt Systems Found</h3>
          <p>Create your first prompt system to get started with testing and evaluation.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="systems-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>Model</th>
                <th>Created</th>
                <th>Metrics</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((system) => (
                <tr key={system.id} className="system-row">
                  <td className="system-name-cell">
                    <div className="name-content">
                      <strong>{system.name}</strong>

                    </div>
                  </td>
                  <td>
                    <span className="provider-badge provider-{system.provider}" title={system.provider === 'openai' ? 'OpenAI' : 'Ollama'}>
                      {system.provider === 'openai' ? (
                        <img src="/logos/openai.svg" alt="OpenAI" width="16" height="16" />
                      ) : (
                        <img src="/logos/meta.png" alt="Ollama" width="16" height="16" />
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="model-badge">{system.model}</span>
                  </td>
                  <td>{new Date(system.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="metrics-display">
                      <div className="metric-item">
                        <span className="metric-label">Score</span>
                        <span className="metric-value score-{getSystemMetrics(system.id).avgScore >= 0.8 ? 'high' : getSystemMetrics(system.id).avgScore >= 0.6 ? 'medium' : 'low'}">
                          {getSystemMetrics(system.id).avgScore}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Runs</span>
                        <span className="metric-value">{getSystemMetrics(system.id).totalRuns}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Trend</span>
                        <span className="metric-value trend-{getSystemMetrics(system.id).trend}">
                          {getSystemMetrics(system.id).trend}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => showTemplate(system.template, system.name, JSON.parse(system.variables))}
                        title="View Template"
                      >
                        Template
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => fetchHistory(system.id, system.name)}
                        disabled={historyLoading}
                        title="View History"
                      >
                        History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPagesMain > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, promptSystems.length)} of {promptSystems.length} systems
              </div>
              <div className="pagination-controls">
                <div className="pagination-buttons">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handlePageChangeMain(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  
                  {Array.from({ length: totalPagesMain }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handlePageChangeMain(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handlePageChangeMain(currentPage + 1)}
                    disabled={currentPage === totalPagesMain}
                  >
                    Next →
                  </button>
                </div>
                
                <div className="pagination-size">
                  <label>
                    Items per page:
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChangeMain(parseInt(e.target.value))}
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
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
        <button
          className="btn btn-large"
          style={{
            background: 'linear-gradient(90deg, #1D2671 0%, #C33764 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(79,140,255,0.15)',
            fontWeight: 600,
            fontSize: '1.1rem',
            padding: '0.7rem 2.2rem',
            borderRadius: '0.5rem',
            transition: 'background 0.2s',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
          onClick={() => setCreateSystemModal(true)}
        >
          Create Prompt System
        </button>
        <button
          className="btn btn-large"
          style={{
            background: 'linear-gradient(90deg, #1D2671 0%, #C33764 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(255,126,95,0.15)',
            fontWeight: 600,
            fontSize: '1.1rem',
            padding: '0.7rem 2.2rem',
            borderRadius: '0.5rem',
            transition: 'background 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => setTestSystemModal(true)}
        >
          Test Prompt System
        </button>
      </div>

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
                          <th></th>
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

      {/* Template Modal */}
      {templateModal.show && (
        <div className="modal-overlay" onClick={() => setTemplateModal({ show: false, template: '', systemName: '', variables: [] })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Template - {templateModal.systemName}</h3>
              <button 
                className="btn-close"
                onClick={() => setTemplateModal({ show: false, template: '', systemName: '', variables: [] })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <h4>Variables</h4>
                <div style={{ 
                  background: '#e3f2fd', 
                  padding: '10px', 
                  borderRadius: '4px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {templateModal.variables.map((variable, index) => (
                    <span key={index} style={{
                      background: '#1976d2',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4>Template</h4>
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '4px', 
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {templateModal.template}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create System Modal */}
      {createSystemModal && (
        <div className="modal-overlay" onClick={() => setCreateSystemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Create Prompt System</h3>
              <button 
                className="btn-close"
                onClick={() => setCreateSystemModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <PromptSystemForm 
                onSuccess={() => {
                  setCreateSystemModal(false)
                  fetchPromptSystems()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Test System Modal */}
      {testSystemModal && (
        <div className="modal-overlay" onClick={() => setTestSystemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h3>Test a System</h3>
              <button 
                className="btn-close"
                onClick={() => setTestSystemModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <TestRunForm />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptSystemsList
