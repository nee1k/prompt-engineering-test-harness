import React, { useState, useEffect } from 'react'
import axios from 'axios'
// styles migrated to global index.css

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function PromptOptimizer() {
  const [promptSystems, setPromptSystems] = useState([])
  const [selectedSystem, setSelectedSystem] = useState('')
  const [optimizationConfig, setOptimizationConfig] = useState({
    maxIterations: 5,
    costBudget: 50.0,
    timeBudget: 3600, // seconds
    evaluationMethod: 'fuzzy'
  })
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState([])
  const [currentIteration, setCurrentIteration] = useState(0)
  const [totalCost, setTotalCost] = useState(0.0)
  const [apiKeyError, setApiKeyError] = useState(false)
  const [regressionSet, setRegressionSet] = useState([])
  const [regressionFileName, setRegressionFileName] = useState('')
  const [evaluationFunctions, setEvaluationFunctions] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPromptSystems()
    fetchEvaluationFunctions()
  }, [])

  const fetchPromptSystems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/prompt-systems/`)
      setPromptSystems(response.data)
    } catch (error) {
      console.error('Error fetching prompt systems:', error)
    }
  }

  const fetchEvaluationFunctions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/evaluation-functions/`)
      setEvaluationFunctions(response.data.evaluation_functions || [])
    } catch (error) {
      console.error('Error fetching evaluation functions:', error)
    }
  }

  const startOptimization = async () => {
    if (!selectedSystem) {
      setMessage('Please select a prompt system to optimize')
      return
    }

    setIsOptimizing(true)
    setHasStarted(true)
    setCurrentIteration(0)
    setTotalCost(0.0)
    setOptimizationResults([])
    setApiKeyError(false)
    setMessage('')

    try {
      const response = await axios.post(`${API_BASE}/prompt-optimizer/start`, {
        promptSystemId: selectedSystem,
        config: optimizationConfig
      })
      const result = response.data
      // Start polling for results
      pollOptimizationResults(result.optimizationId)
    } catch (error) {
      console.error('Error starting optimization:', error)
      setIsOptimizing(false)
      setMessage(`Error: ${error.response?.data?.detail || error.message || 'Failed to start optimization'}`)
    }
  }

  const handleRegressionFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setRegressionFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE}/upload-regression-set/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const data = response.data
      setRegressionSet(data.regression_set || [])
    } catch (error) {
      console.error('Error uploading regression set:', error)
      setRegressionSet([])
      setMessage(`Error: ${error.response?.data?.detail || error.message || 'Upload failed'}`)
    }
  }

  // Fixed: Use recursive polling with setTimeout to avoid overlapping intervals and memory leaks.
  const pollOptimizationResults = (optimizationId) => {
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const response = await axios.get(`${API_BASE}/prompt-optimizer/${optimizationId}/status`);
        const data = response.data;

        setCurrentIteration(data.currentIteration);
        setTotalCost(data.totalCost);
        setOptimizationResults(data.results || []);

        // Determine selected provider from current promptSystems
        const selectedProvider = promptSystems.find(ps => String(ps.id) === String(selectedSystem))?.provider;

        // Check for API key errors in the results (only for OpenAI)
        if (selectedProvider === 'openai' && data.results && data.results.length > 0) {
          const hasApiKeyError = data.results.some(
            result => result.error && result.error.includes('Invalid OpenAI API key')
          );
          if (hasApiKeyError) {
            setIsOptimizing(false);
            setApiKeyError(true);
            setMessage('Error: OpenAI API Key is invalid or missing. Optimization stopped.');
            stopped = true;
            return;
          }
        }

        if (data.status === 'completed' || data.status === 'failed') {
          setIsOptimizing(false);
          stopped = true;
          return;
        }

        setTimeout(poll, 2000);
      } catch (error) {
        setIsOptimizing(false);
        setMessage(`Error: ${error.response?.data?.detail || error.message || 'Polling failed'}`);
        stopped = true;
      }
    };

    poll();
  };

  const stopOptimization = async () => {
    try {
      await axios.post(`${API_BASE}/prompt-optimizer/stop`)
      setIsOptimizing(false)
    } catch (error) {
      console.error('Error stopping optimization:', error)
      setMessage(`Error: ${error.response?.data?.detail || error.message || 'Failed to stop optimization'}`)
    }
  }

  const getScoreClass = (score) => {
    if (score >= 0.8) return 'high'
    if (score >= 0.5) return 'medium'
    return 'low'
  }

  return (
    <div className="run-test-container">
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="test-form-container">
        <form className="test-form" onSubmit={(e) => { e.preventDefault(); startOptimization() }}>
          <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label>Prompt System:</label>
              <select 
                value={selectedSystem} 
                onChange={(e) => setSelectedSystem(e.target.value)}
                disabled={isOptimizing}
                required
              >
                <option value="">Choose a prompt system...</option>
                {promptSystems.map(system => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Evaluation Function:</label>
              <select
                value={optimizationConfig.evaluationMethod}
                onChange={(e) => setOptimizationConfig({
                  ...optimizationConfig,
                  evaluationMethod: e.target.value
                })}
                disabled={isOptimizing}
                required
              >
                {evaluationFunctions.length > 0 ? (
                  evaluationFunctions.map(func => (
                    <option key={func.id} value={func.id}>
                      {func.name} - {func.description}
                    </option>
                  ))
                ) : (
                  <option value="fuzzy">Fuzzy</option>
                )}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label>Max Iterations:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={optimizationConfig.maxIterations}
                onChange={(e) => setOptimizationConfig({
                  ...optimizationConfig,
                  maxIterations: parseInt(e.target.value)
                })}
                disabled={isOptimizing}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Cost Budget ($):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={optimizationConfig.costBudget}
                onChange={(e) => setOptimizationConfig({
                  ...optimizationConfig,
                  costBudget: parseFloat(e.target.value)
                })}
                disabled={isOptimizing}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Time Budget (seconds):</label>
              <input
                type="number"
                min="60"
                value={optimizationConfig.timeBudget}
                onChange={(e) => setOptimizationConfig({
                  ...optimizationConfig,
                  timeBudget: parseInt(e.target.value)
                })}
                disabled={isOptimizing}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Regression Set:</label>
            <div className="file-upload-container">
              <div className="file-upload" onClick={() => document.getElementById('optimizer-file-input').click()}>
                <input
                  id="optimizer-file-input"
                  type="file"
                  accept=".csv,.jsonl"
                  onChange={handleRegressionFileUpload}
                  disabled={isOptimizing}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="upload-content">
                  <p className="upload-title">
                    {regressionFileName || 'Click to select file'}
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

          <div className="form-actions">
            {!isOptimizing ? (
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={!selectedSystem || apiKeyError}
              >
                {apiKeyError ? 'Fix API Key First' : 'Optimize Prompt'}
              </button>
            ) : (
              <button 
                type="button"
                className="btn btn-danger"
                onClick={stopOptimization}
              >
                Stop Optimization
              </button>
            )}
          </div>
        </form>
      </div>

      {(apiKeyError || hasStarted) && (
        <div className="results-container">
          <div className="results-header">
            <div className="results-summary">
              <div className="summary-item">
                <span className="summary-label">Iteration</span>
                <span className="summary-value">{currentIteration} / {optimizationConfig.maxIterations}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Cost</span>
                <span className="summary-value">${totalCost.toFixed(2)} / ${optimizationConfig.costBudget}</span>
              </div>
            </div>
          </div>

          {optimizationResults.length > 0 && (
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Iteration</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationResults.slice(0, 5).map((result, index) => (
                    <tr key={index}>
                      <td>{result.iteration}</td>
                      <td className="score-cell">
                        <span className={`score ${getScoreClass(result.score || 0)}`}>
                          {(((result.score || 0)) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="output-cell">
                        {result.prompt ? (
                          <pre className="json-display" style={{ whiteSpace: 'pre-wrap' }}>{result.prompt}</pre>
                        ) : (
                          <span className="error-text">{result.error || 'Failed to generate improved prompt.'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PromptOptimizer
