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
            <textarea
              name="template"
              value={promptTemplate}
              onChange={e => setPromptTemplate(e.target.value)}
              required
              placeholder="Enter prompt template with {variable} placeholders"
            />
          </div>

          {/* Regression Set Section */}
          <div className="form-group">
            <label>Regression Set:</label>
            <div className="file-upload-container">
              <div className="file-upload" onClick={() => document.getElementById('regression-file-input').click()}>
                <input
                  id="regression-file-input"
                  type="file"
                  accept=".csv,.jsonl"
                  onChange={handleRegressionFileUpload}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="upload-content">
                  <p className="upload-title">
                    {regressionFile ? regressionFile.name : 'Click to select file'}
                  </p>
                  <p className="upload-description">
                    File should contain columns for variables and an 'expected_output' column
                  </p>
                </div>
              </div>
            </div>
            {regressionSet.length > 0 && (
              <div className="form-group">
                <label>Preview ({regressionSet.length} samples):</label>
                <div className="preview-container">
                  <pre className="preview-content">{JSON.stringify(regressionSet.slice(0, 3), null, 2)}</pre>
                  {regressionSet.length > 3 && <p className="preview-more">... and {regressionSet.length - 3} more samples</p>}
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Function Section */}
          <div className="form-group">
            <label>Evaluation Function:</label>
            <select 
              value={selectedEvaluationFunction} 
              onChange={(e) => setSelectedEvaluationFunction(e.target.value)}
              required
            >
              {evaluationFunctions.map((func) => (
                <option key={func.id} value={func.id}>
                  {func.name} - {func.description}
                </option>
              ))}
            </select>
          </div>

          {/* Models Selection Section */}
          <div className="form-group">
            <label>Model:</label>
            <div className="model-selection-container">
              <select
                className="form-control"
                value=""
                onChange={e => {
                  const modelId = e.target.value;
                  if (modelId && !selectedModels.includes(modelId)) {
                    setSelectedModels([...selectedModels, modelId]);
                  }
                }}
              >
                <option value="">Choose a model...</option>
                {Object.entries(availableModels).map(([provider, models]) =>
                  models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({getProviderName(provider)})
                    </option>
                  ))
                )}
              </select>
              {selectedModels.length > 0 && (
                <div className="selected-models-list" style={{ marginTop: '1rem' }}>
                  <label>Selected Models:</label>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {selectedModels.map(modelId => {
                      // Find model info
                      let foundModel = null;
                      let foundProvider = null;
                      Object.entries(availableModels).forEach(([provider, models]) => {
                        const m = models.find(mod => mod.id === modelId);
                        if (m) {
                          foundModel = m;
                          foundProvider = provider;
                        }
                      });
                      if (!foundModel) return null;
                      return (
                        <li key={modelId} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ marginRight: 8 }}>
                            {foundModel.name} <span style={{ color: '#888' }}>({getProviderName(foundProvider)})</span>
                          </span>
                          <button
                            type="button"
                            className="btn btn-xs btn-danger"
                            style={{ marginLeft: 8 }}
                            onClick={() => setSelectedModels(selectedModels.filter(id => id !== modelId))}
                            title="Remove"
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setSelectedModels([])}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>


          {/* Compare Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || !promptTemplate || selectedModels.length === 0 || regressionSet.length === 0}
              onClick={handleRunComparison}
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

    </div>
  )
}

export default CompareModels
