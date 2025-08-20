import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function PromptSystemsList() {
  const [promptSystems, setPromptSystems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
              <th>Created (Latest First)</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default PromptSystemsList
