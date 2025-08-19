import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function TestResults() {
  const [testRuns, setTestRuns] = useState([])
  const [selectedRun, setSelectedRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTestRuns()
  }, [])

  const fetchTestRuns = async () => {
    try {
      const response = await axios.get(`${API_BASE}/test-runs/`)
      setTestRuns(response.data)
    } catch (error) {
      setError('Failed to fetch test runs')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTestRunDetails = async (testRunId) => {
    try {
      const response = await axios.get(`${API_BASE}/test-runs/${testRunId}`)
      setSelectedRun(response.data)
    } catch (error) {
      console.error('Error fetching test run details:', error)
    }
  }

  const getScoreClass = (score) => {
    if (score >= 0.8) return 'high'
    if (score >= 0.5) return 'medium'
    return 'low'
  }

  if (loading) {
    return <div className="loading">Loading test results...</div>
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  return (
    <div>
      <div className="card">
        <h2>Test Results History</h2>
        
        {testRuns.length === 0 ? (
          <p>No test runs found. Run your first test!</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Prompt System</th>
                <th>Average Score</th>
                <th>Total Samples</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testRuns.map((run) => (
                <tr key={run.id}>
                  <td>{new Date(run.created_at).toLocaleString()}</td>
                  <td>{run.prompt_system?.name || 'Unknown'}</td>
                  <td>
                    <span className={`score ${getScoreClass(run.avg_score || 0)}`}>
                      {run.avg_score ? (run.avg_score * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </td>
                  <td>{run.total_samples || 0}</td>
                  <td>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => fetchTestRunDetails(run.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedRun && (
        <div className="card">
          <h3>Test Run Details</h3>
          <div style={{ marginBottom: '20px' }}>
            <strong>Date:</strong> {new Date(selectedRun.test_run.created_at).toLocaleString()}<br />
            <strong>Average Score:</strong> 
            <span className={`score ${getScoreClass(selectedRun.test_run.avg_score || 0)}`}>
              {selectedRun.test_run.avg_score ? (selectedRun.test_run.avg_score * 100).toFixed(1) + '%' : 'N/A'}
            </span><br />
            <strong>Total Samples:</strong> {selectedRun.test_run.total_samples || 0}
          </div>

          <table className="table">
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
              {selectedRun.results.map((result) => (
                <tr key={result.id}>
                  <td>{result.sample_id}</td>
                  <td style={{ maxWidth: '150px', wordBreak: 'break-word' }}>
                    <pre style={{ fontSize: '12px' }}>
                      {JSON.stringify(JSON.parse(result.input_variables), null, 2)}
                    </pre>
                  </td>
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

export default TestResults
