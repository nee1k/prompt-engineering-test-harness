import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

function TestRunForm() {
  const [promptSystems, setPromptSystems] = useState([])
  const [selectedSystem, setSelectedSystem] = useState('')
  const [regressionSet, setRegressionSet] = useState([])
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    fetchPromptSystems()
  }, [])

  const fetchPromptSystems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/prompt-systems/`)
      setPromptSystems(response.data)
    } catch (error) {
      console.error('Error fetching prompt systems:', error)
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
        regression_set: regressionSet
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
    <div>
      <div className="card">
        <h2>Run Test</h2>
        
        {message && (
          <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleRunTest}>
          <div className="form-group">
            <label>Select Prompt System:</label>
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
            <label>Upload Regression Set (CSV or JSONL):</label>
            <div className="file-upload" onClick={() => document.getElementById('file-input').click()}>
              <input
                id="file-input"
                type="file"
                accept=".csv,.jsonl"
                onChange={handleFileUpload}
                disabled={loading}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📁</div>
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {file ? file.name : 'Click to select file'}
              </p>
              <p style={{ fontSize: '12px', color: '#666' }}>
                File should contain columns for variables and an 'expected_output' column
              </p>
              {!file && (
                <p style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                  Supports .csv and .jsonl files
                </p>
              )}
            </div>
          </div>

          {regressionSet.length > 0 && (
            <div className="form-group">
              <label>Preview ({regressionSet.length} samples):</label>
              <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                <pre>{JSON.stringify(regressionSet.slice(0, 3), null, 2)}</pre>
                {regressionSet.length > 3 && <p>... and {regressionSet.length - 3} more samples</p>}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-success" 
            disabled={loading || !selectedSystem || regressionSet.length === 0}
          >
            {loading ? 'Running Test...' : 'Run Test'}
          </button>
        </form>
      </div>

      {testResult && (
        <div className="card">
          <h3>Test Results</h3>
          <div style={{ marginBottom: '20px' }}>
            <strong>Average Score:</strong> 
            <span className={`score ${getScoreClass(testResult.avg_score)}`}>
              {(testResult.avg_score * 100).toFixed(1)}%
            </span>
            <br />
            <strong>Total Samples:</strong> {testResult.total_samples}
          </div>

          <table className="table">
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
                  <td>{result.sample_id}</td>
                  <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                    {result.expected_output}
                  </td>
                  <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                    {result.predicted_output}
                  </td>
                  <td>
                    <span className={`score ${getScoreClass(result.score)}`}>
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TestRunForm
