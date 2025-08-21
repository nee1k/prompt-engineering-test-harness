import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function CompareModels() {
  // Core state
  const [promptTemplate, setPromptTemplate] = useState('')
  const [regressionSet, setRegressionSet] = useState([])
  const [selectedModels, setSelectedModels] = useState([])
  const [selectedEvaluationFunction, setSelectedEvaluationFunction] = useState('fuzzy')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // File uploads
  const [promptFile, setPromptFile] = useState(null)
  const [regressionFile, setRegressionFile] = useState(null)
  
  // API data
  const [availableModels, setAvailableModels] = useState({})
  const [evaluationFunctions, setEvaluationFunctions] = useState([])
  const [comparisonHistory, setComparisonHistory] = useState([])
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [comparisonResults, setComparisonResults] = useState([])
  const [modelSearch, setModelSearch] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  
  // Advanced settings
  const [modelSettings, setModelSettings] = useState({
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    top_k: null
  })

  useEffect(() => {
    fetchAvailableModels()
    fetchEvaluationFunctions()
    fetchComparisonHistory()
  }, [])

  // Extract variables from prompt template
  const extractVariables = (template) => {
    const variableRegex = /\{([^}]+)\}/g
    const variables = []
    let match
    while ((match = variableRegex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }
    return variables
  }

  const templateVariables = extractVariables(promptTemplate)

  // API calls
  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/models/`)
      setAvailableModels(response.data)
    } catch (error) {
      console.error('Error fetching available models:', error)
      setMessage('Failed to fetch available models')
    }
  }

  const fetchEvaluationFunctions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/evaluation-functions/`)
      setEvaluationFunctions(response.data.evaluation_functions)
    } catch (error) {
      console.error('Error fetching evaluation functions:', error)
    }
  }

  const fetchComparisonHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/model-comparisons/`)
      setComparisonHistory(response.data)
    } catch (error) {
      console.error('Error fetching comparison history:', error)
    }
  }

  // File upload handlers
  const handlePromptFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPromptFile(file)
    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${API_BASE}/upload-prompt-template/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setPromptTemplate(response.data.template)
      setMessage('Prompt template uploaded successfully!')
    } catch (error) {
      setMessage(`Error uploading prompt template: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRegressionFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setRegressionFile(file)
    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${API_BASE}/upload-regression-set/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setRegressionSet(response.data.regression_set)
      setMessage(`Regression set uploaded successfully! Loaded ${response.data.regression_set.length} samples`)
    } catch (error) {
      setMessage(`Error uploading regression set: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Model selection
  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  // Manual regression set input
  const handleManualRegressionInput = (e) => {
    try {
      const data = JSON.parse(e.target.value)
      setRegressionSet(Array.isArray(data) ? data : [data])
    } catch (error) {
      // Allow partial input while typing
    }
  }

  // Run comparison
  const handleRunComparison = async (e) => {
    e.preventDefault()
    
    if (!promptTemplate.trim()) {
      setMessage('Please enter or upload a prompt template')
      return
    }
    
    if (regressionSet.length === 0) {
      setMessage('Please upload or enter regression set data')
      return
    }
    
    if (selectedModels.length === 0) {
      setMessage('Please select at least one model to compare')
      return
    }

    setLoading(true)
    setMessage('')
    setComparisonResults([])

    try {
      const response = await axios.post(`${API_BASE}/model-comparisons/`, {
        prompt_template: promptTemplate,
        template_variables: templateVariables,
        model_settings: modelSettings,
        models: selectedModels,
        regression_set: regressionSet,
        evaluation_function: selectedEvaluationFunction
      })
      
      setComparisonResults(response.data.results)
      setMessage('Model comparison completed successfully!')
      fetchComparisonHistory()
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Utility functions
  const getScoreClass = (score) => {
    if (score >= 0.8) return 'high'
    if (score >= 0.5) return 'medium'
    return 'low'
  }

  const formatModelName = (modelId) => {
    return modelId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getProviderName = (provider) => {
    return provider === 'openai' ? 'OpenAI' : 'Ollama (Local)'
  }

  return (
    <div className="run-test-container">
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="test-form-container">
        <form onSubmit={handleRunComparison} className="test-form">
          
          {/* Prompt Template Section */}
          <div className="form-group">
            <label>Prompt Template:</label>
            <div className="input-section">
              <div className="input-tabs">
                <button
                  type="button"
                  className="tab-button active"
                  onClick={() => setPromptTemplate('')}
                >
                  Enter Manually
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => document.getElementById('prompt-file-input').click()}
                >
                  Upload File
                </button>
                <input
                  id="prompt-file-input"
                  type="file"
                  accept=".txt,.md"
                  onChange={handlePromptFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="Enter your prompt template with {variable} placeholders..."
                required
                rows={6}
              />
              {templateVariables.length > 0 && (
                <div className="variables-display">
                  <small>Detected variables: {templateVariables.join(', ')}</small>
                </div>
              )}
            </div>
          </div>

          {/* Regression Set Section */}
          <div className="form-group">
            <label>Regression Set:</label>
            <div className="input-section">
              <div className="input-tabs">
                <button
                  type="button"
                  className="tab-button active"
                  onClick={() => setRegressionSet([])}
                >
                  Enter Manually
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => document.getElementById('regression-file-input').click()}
                >
                  Upload File
                </button>
                <input
                  id="regression-file-input"
                  type="file"
                  accept=".csv,.jsonl"
                  onChange={handleRegressionFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <textarea
                value={regressionSet.length > 0 ? JSON.stringify(regressionSet, null, 2) : ''}
                onChange={handleManualRegressionInput}
                placeholder="Enter JSON array of test cases with variables and expected_output..."
                rows={6}
              />
              {regressionSet.length > 0 && (
                <div className="regression-preview">
                  <small>Loaded {regressionSet.length} test samples</small>
                </div>
              )}
            </div>
          </div>

          {/* Evaluation Function Section */}
          <div className="form-group">
            <label>Evaluation Function:</label>
            <select
              value={selectedEvaluationFunction}
              onChange={(e) => setSelectedEvaluationFunction(e.target.value)}
              required
            >
              <option value="">Select evaluation function...</option>
              {Array.isArray(evaluationFunctions) && evaluationFunctions.map((func) => {
                const value = typeof func === 'string' ? func : (func.id || '')
                const label = typeof func === 'string' ? func : (func.name || func.id || '')
                if (!value) return null
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Models Selection Section */}
          <div className="form-group">
            <label>Select Models to Compare:</label>
            <div className="model-selection-container">
              <div className="model-selection-header">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="selection-summary">
                  <span>{selectedModels.length} selected</span>
                  {selectedModels.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedModels([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              
              <div className="model-list">
                {Object.entries(availableModels).map(([provider, models]) => {
                  const filteredModels = models.filter(m => 
                    !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase())
                  )
                  
                  if (filteredModels.length === 0) return null
                  
                  return (
                    <div key={provider} className="provider-section">
                      <div className="provider-header">
                        <h4>{getProviderName(provider)}</h4>
                        <span className="model-count">{filteredModels.length} models</span>
                      </div>
                      <div className="models-grid">
                        {filteredModels.map((model) => {
                          const isSelected = selectedModels.includes(model.id)
                          return (
                            <label key={model.id} className="model-item">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleModelToggle(model.id)}
                              />
                              <div className="model-info">
                                <div className="model-name">{model.name}</div>
                                <div className="model-provider">{getProviderName(provider)}</div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-settings">
              <h4>Advanced Model Settings</h4>
              <div className="settings-grid">
                <div className="form-group">
                  <label>Temperature:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={modelSettings.temperature}
                    onChange={(e) => setModelSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  />
                  <small>0 = deterministic, higher = more creative</small>
                </div>
                <div className="form-group">
                  <label>Max Tokens:</label>
                  <input
                    type="number"
                    min="1"
                    value={modelSettings.max_tokens}
                    onChange={(e) => setModelSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                  />
                  <small>Limit response length</small>
                </div>
                <div className="form-group">
                  <label>Top P:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={modelSettings.top_p}
                    onChange={(e) => setModelSettings(prev => ({ ...prev, top_p: parseFloat(e.target.value) }))}
                  />
                  <small>Nucleus sampling</small>
                </div>
                <div className="form-group">
                  <label>Top K:</label>
                  <input
                    type="number"
                    min="1"
                    value={modelSettings.top_k || ''}
                    onChange={(e) => setModelSettings(prev => ({ ...prev, top_k: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="Leave empty"
                  />
                  <small>Ollama only</small>
                </div>
              </div>
            </div>
          )}

          {/* Compare Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !promptTemplate || selectedModels.length === 0 || regressionSet.length === 0}
            >
              {loading ? 'Running Comparison...' : 'Compare Models'}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results */}
      {comparisonResults.length > 0 && (
        <div className="results-container">
          <div className="results-header">
            <h3>Comparison Results</h3>
            <div className="results-summary">
              <div className="summary-item">
                <span className="summary-label">Models Tested:</span>
                <span className="summary-value">{comparisonResults.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Best Score:</span>
                <span className={`score ${getScoreClass(Math.max(...comparisonResults.map(r => r.avg_score || 0)))}`}>
                  {(Math.max(...comparisonResults.map(r => r.avg_score || 0)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Average Score</th>
                  <th>Total Samples</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults
                  .slice()
                  .sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0))
                  .map((result, index) => (
                    <tr key={index}>
                      <td>{formatModelName(result.model)}</td>
                      <td>{getProviderName(result.provider)}</td>
                      <td className="score-cell">
                        <span className={`score ${getScoreClass(result.avg_score || 0)}`}>
                          {((result.avg_score || 0) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>{result.total_samples}</td>
                      <td>
                        <span className={`status-badge ${result.status === 'completed' ? 'active' : 'inactive'}`}>
                          {result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison History */}
      <div className="history-container">
        <div className="history-header">
          <h3>Comparison History</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setShowHistoryModal(true)}>View Details</button>
        </div>
        {comparisonHistory.length === 0 ? (
          <div className="empty-state">
            <h4>No comparison history yet</h4>
            <p>Run a comparison to see results here.</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Models</th>
                  <th>Best Score</th>
                </tr>
              </thead>
              <tbody>
                {comparisonHistory.slice(0, 5).map((comparison) => (
                  <tr key={comparison.id}>
                    <td>{new Date(comparison.created_at).toLocaleDateString()}</td>
                    <td>{comparison.models.length}</td>
                    <td className="score-cell">
                      <span className="score">
                        {(() => {
                          const scores = (comparison.results || []).map(r => (typeof r.avg_score === 'number' ? r.avg_score : 0))
                          return (scores.length ? Math.max(...scores) : 0).toFixed(3)
                        })()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h3>Comparison History Details</h3>
              <button className="btn-close" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {comparisonHistory.map((comparison) => (
                <div key={comparison.id} className="history-item">
                  <h4>Template Comparison • {new Date(comparison.created_at).toLocaleString()}</h4>
                  {comparison.prompt_template && (
                    <div className="template-preview">
                      {comparison.prompt_template.substring(0, 200)}{comparison.prompt_template.length > 200 ? '…' : ''}
                    </div>
                  )}
                  <div className="history-results-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th>Score</th>
                          <th>Samples</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.results.map((result, index) => (
                          <tr key={index}>
                            <td>{formatModelName(result.model)}</td>
                            <td className="score-cell">
                              <span className={`score ${getScoreClass(result.avg_score || 0)}`}>
                                {((result.avg_score || 0) * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td>{result.total_samples}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompareModels
