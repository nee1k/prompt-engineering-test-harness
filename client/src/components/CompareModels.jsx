import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function CompareModels() {
  const [availableModels, setAvailableModels] = useState({})
  const [selectedModels, setSelectedModels] = useState([])
  const [regressionSet, setRegressionSet] = useState([])
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [comparisonResults, setComparisonResults] = useState([])
  const [evaluationFunctions, setEvaluationFunctions] = useState([])
  const [selectedEvaluationFunction, setSelectedEvaluationFunction] = useState('fuzzy')
  const [comparisonHistory, setComparisonHistory] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  
  // UI enhancements
  const [modelSearch, setModelSearch] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // New state for prompt template
  const [promptTemplate, setPromptTemplate] = useState('')
  const [templateVariables, setTemplateVariables] = useState([])
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

  // Update template variables when prompt template changes
  useEffect(() => {
    const variables = extractVariables(promptTemplate)
    setTemplateVariables(variables)
  }, [promptTemplate])

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFile(file)
    setLoading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE}/upload-regression-set/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setRegressionSet(response.data.regression_set)
      setMessage(`Successfully loaded ${response.data.regression_set.length} samples`)
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  const handleRunComparison = async (e) => {
    e.preventDefault()
    if (!promptTemplate || selectedModels.length === 0 || regressionSet.length === 0) {
      setMessage('Please enter a prompt template, select at least one model, and upload a regression set')
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
      fetchComparisonHistory() // Refresh history
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getScoreClass = (score) => {
    if (score >= 0.8) return 'high'
    if (score >= 0.5) return 'medium'
    return 'low'
  }

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatModelName = (modelId) => {
    // Extract model name from ID (e.g., "gpt-4" -> "GPT-4")
    return modelId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getProviderName = (provider) => {
    return provider === 'openai' ? 'OpenAI' : 'Ollama (Local)'
  }

  return (
    <div className="prompt-systems-container">

      {/* Setup Form */}
      <div className="table-container" style={{ padding: '16px' }}>
        <h2 style={{ marginBottom: '12px' }}>Setup Comparison</h2>
        
        <form onSubmit={handleRunComparison}>
          {/* 1. Prompt Template */}
          <div className="form-group">
            <label>1. Prompt Template</label>
            <textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="Enter your prompt template with {variable} placeholders..."
              required
            />
            {templateVariables.length > 0 && (
              <small>Detected variables: {templateVariables.join(', ')}</small>
            )}
          </div>

          {/* Model Settings */}
          {showAdvanced && (
            <div>
              <div className="form-group">
                <label>Temperature <small>(0 = deterministic, higher = more creative)</small></label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={modelSettings.temperature}
                  onChange={(e) => setModelSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="form-group">
                <label>Max Tokens <small>(limit response length)</small></label>
                <input
                  type="number"
                  min="1"
                  value={modelSettings.max_tokens}
                  onChange={(e) => setModelSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                />
              </div>
              <div className="form-group">
                <label>Top P <small>(nucleus sampling)</small></label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={modelSettings.top_p}
                  onChange={(e) => setModelSettings(prev => ({ ...prev, top_p: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="form-group">
                <label>Top K <small>(Ollama only)</small></label>
                <input
                  type="number"
                  min="1"
                  value={modelSettings.top_k || ''}
                  onChange={(e) => setModelSettings(prev => ({ ...prev, top_k: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Leave empty"
                />
              </div>
            </div>
          )}

          {/* 2. Model Selection */}
          <div className="form-group">
            <label>2. Select Models to Compare</label>
            <div className="table-container" style={{ padding: 0 }}>
              {Object.entries(availableModels).map(([provider, models]) => (
                <div key={provider} style={{ marginBottom: '12px' }}>
                  <h4 style={{ margin: '8px 0' }}>{getProviderName(provider)}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {models
                      .filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()))
                      .map((model) => (
                        <label key={model.id} className="checkbox-label" style={{ minWidth: '240px' }}>
                          <div className="checkbox-container">
                            <input
                              type="checkbox"
                              className="checkbox-input"
                              checked={selectedModels.includes(model.id)}
                              onChange={() => handleModelToggle(model.id)}
                            />
                            <div className="checkbox-custom">
                              <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                          <span className="checkbox-text">{model.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Evaluation Function */}
          <div className="form-group">
            <label>3. Evaluation Function</label>
            <select
              value={selectedEvaluationFunction}
              onChange={(e) => setSelectedEvaluationFunction(e.target.value)}
            >
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

          {/* 4. Regression Set Upload */}
          <div className="form-group">
            <label>4. Upload Regression Set (CSV or JSONL)</label>
            <div className="file-upload-container">
              <div className="file-upload" onClick={() => document.getElementById('compare-file-input').click()}>
                <input
                  id="compare-file-input"
                  type="file"
                  accept=".csv,.jsonl"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="upload-content">
                  <p className="upload-title">{file ? file.name : 'Click to select file'}</p>
                  <p className="upload-description">File should contain columns for variables and an 'expected_output' column</p>
                  {!file && <p className="upload-hint">Supports .csv and .jsonl files</p>}
                </div>
              </div>
            </div>
            {regressionSet.length > 0 && (
              <small>Loaded {regressionSet.length} test samples</small>
            )}
          </div>

          {/* Run Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !promptTemplate || selectedModels.length === 0 || regressionSet.length === 0}
            >
              {loading ? 'Running Comparison...' : 'Run Model Comparison'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonResults.length > 0 && (
        <div className="table-container">
          <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Comparison Results</h2>
            <small>Sorted by score (desc)</small>
          </div>
          <table className="systems-table">
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
                    <td>
                      <span className={`score-badge ${getScoreClass(result.avg_score || 0)}`}>
                        {(typeof result.avg_score === 'number' ? result.avg_score : 0).toFixed(3)}
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
      )}

      {/* Comparison History */}
      <div className="table-container" style={{ marginTop: '16px' }}>
        <div className="history-table">
          <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Comparison History</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowHistoryModal(true)}>View Details</button>
          </div>
          {comparisonHistory.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '12px' }}>
              <h3>No comparison history yet</h3>
              <p>Run a comparison to see results here.</p>
            </div>
          ) : (
            <table>
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
                    <td>
                      <span className="score-badge">
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
          )}
        </div>
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
                <div key={comparison.id} className="table-container" style={{ marginBottom: '16px' }}>
                  <h4 style={{ marginBottom: '8px' }}>Template Comparison • {new Date(comparison.created_at).toLocaleString()}</h4>
                  {comparison.prompt_template && (
                    <div style={{
                      background: '#f8f9fa',
                      padding: '10px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {comparison.prompt_template.substring(0, 200)}{comparison.prompt_template.length > 200 ? '…' : ''}
                    </div>
                  )}
                  <div className="history-table" style={{ marginTop: '12px' }}>
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
                            <td>
                              <span className={`score-badge ${getScoreClass(result.avg_score || 0)}`}>
                                {(typeof result.avg_score === 'number' ? result.avg_score : 0).toFixed(3)}
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
