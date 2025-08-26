import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function TestRunForm() {
  const [promptSystems, setPromptSystems] = useState([])
  const [selectedSystem, setSelectedSystem] = useState('')
  const [regressionSet, setRegressionSet] = useState([])
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [evaluationFunctions, setEvaluationFunctions] = useState([])
  const [selectedEvaluationFunction, setSelectedEvaluationFunction] = useState('fuzzy')

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
      setEvaluationFunctions(response.data.evaluation_functions)
    } catch (error) {
      console.error('Error fetching evaluation functions:', error)
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

  const handleRunTest = async (e) => {
    e.preventDefault()
    if (!selectedSystem || regressionSet.length === 0) {
      setMessage('Please select a prompt system and upload a regression set')
      return
    }

    setLoading(true)
    setMessage('')
    setTestResult(null)

    try {
      const response = await axios.post(`${API_BASE}/test-runs/`, {
        prompt_system_id: selectedSystem,
        regression_set: regressionSet,
        evaluation_function: selectedEvaluationFunction
      })
      
      setTestResult(response.data)
      setMessage('Test completed successfully!')
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

  return (
    <div className="run-test-container">      
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="test-form-container">
        <form onSubmit={handleRunTest} className="test-form">
          <div className="form-group">
            <label>Prompt System:</label>
            <select 
              value={selectedSystem} 
              onChange={(e) => setSelectedSystem(e.target.value)}
              required
            >
              <option value="">Choose a prompt system...</option>
              {promptSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name} ({system.model})
                </option>
              ))}
            </select>
          </div>

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

          <div className="form-group">
            <label>Regression Set:</label>
            <div className="file-upload-container">
              <div className="file-upload" onClick={() => document.getElementById('file-input').click()}>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.jsonl"
                  onChange={handleFileUpload}
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
                    {file ? file.name : 'Click to select file'}
                  </p>
                  <p className="upload-description">
                    File should contain columns for variables and an 'expected_output' column
                  </p>
                  {!file && (
                    <p className="upload-hint">
                      Supports .csv and .jsonl files
                    </p>
                  )}
                </div>
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

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !selectedSystem || regressionSet.length === 0}
            >
              {loading ? (
                <>
                  Running Test...
                </>
              ) : (
                <>
                  Run Test
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {testResult && (
        <div className="results-container">
          <div className="results-header">
            <h3>Test Results</h3>
            <div className="results-summary">
              <div className="summary-item">
                <span className="summary-label">Average Score:</span>
                <span className={`score ${getScoreClass(testResult.avg_score)}`}>
                  {(testResult.avg_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Samples:</span>
                <span className="summary-value">{testResult.total_samples}</span>
              </div>
            </div>
          </div>

          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Sample</th>
                  <th>Expected Output</th>
                  <th>Predicted Output</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {testResult.results.map((result, index) => (
                  <tr key={index}>
                    <td className="sample-id">{result.sample_id}</td>
                    <td className="output-cell">
                      {result.expected_output}
                    </td>
                    <td className="output-cell">
                      {result.predicted_output}
                    </td>
                    <td className="score-cell">
                      <span className={`score ${getScoreClass(result.score)}`}>
                        {(result.score * 100).toFixed(1)}%
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

export default TestRunForm
