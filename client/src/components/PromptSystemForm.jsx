import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = window.location.hostname === 'localhost' && window.location.port === '3000' 
  ? 'http://localhost:8000' 
  : '/api'

function PromptSystemForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    template: '',
    variables: '',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    top_k: null
  })
  const [availableModels, setAvailableModels] = useState({})
  const [ollamaStatus, setOllamaStatus] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAvailableModels()
    checkOllamaStatus()
  }, [])

  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/models/`)
      setAvailableModels(response.data)
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const checkOllamaStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/ollama/status/`)
      setOllamaStatus(response.data)
    } catch (error) {
      console.error('Error checking Ollama status:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleProviderChange = (e) => {
    const provider = e.target.value
    setFormData(prev => ({
      ...prev,
      provider,
      model: availableModels[provider]?.[0]?.id || ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Parse variables string into array
      const variables = formData.variables
        .split(',')
        .map(v => v.trim())
        .filter(v => v)

      const payload = {
        ...formData,
        variables
      }

      await axios.post(`${API_BASE}/prompt-systems/`, payload)
      setMessage('Prompt system created successfully!')
      setFormData({
        name: '',
        template: '',
        variables: '',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0,
        top_k: null
      })
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentModels = () => {
    return availableModels[formData.provider] || []
  }

  return (
    <div className="create-system-container">      
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter system name"
          />
        </div>

        <div className="form-group">
          <label>Prompt Template:</label>
          <textarea
            name="template"
            value={formData.template}
            onChange={handleChange}
            required
            placeholder="Enter prompt template with {variable} placeholders"
          />
        </div>

        <div className="form-group">
          <label>Variables (comma-separated):</label>
          <input
            type="text"
            name="variables"
            value={formData.variables}
            onChange={handleChange}
            required
            placeholder="e.g., text, language, style"
          />
        </div>

        <div className="form-group">
          <label>Provider:</label>
          <select name="provider" value={formData.provider} onChange={handleProviderChange} className="provider-select">
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama (Local)</option>
          </select>
          {formData.provider === 'ollama' && ollamaStatus && (
            <div className="ollama-status">
              {ollamaStatus.status === 'running' ? (
                <span className="status-success">✓ Ollama is running</span>
              ) : (
                <span className="status-error">✗ Ollama is not running</span>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Model:</label>
          <select name="model" value={formData.model} onChange={handleChange}>
            {getCurrentModels().map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Temperature:</label>
          <input
            type="number"
            name="temperature"
            value={formData.temperature}
            onChange={handleChange}
            min="0"
            max="2"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label>Max Tokens:</label>
          <input
            type="number"
            name="max_tokens"
            value={formData.max_tokens}
            onChange={handleChange}
            min="1"
            max="4000"
          />
        </div>

        <div className="form-group">
          <label>Top P:</label>
          <input
            type="number"
            name="top_p"
            value={formData.top_p}
            onChange={handleChange}
            min="0"
            max="1"
            step="0.1"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading} align="center">
            {loading ? (
              <>
                <span className="btn-icon">⏳</span>
                Creating...
              </>
            ) : (
              <>
                <span className="btn-icon">✨</span>
                Create Prompt System
                <span className="btn-icon"> ✨</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
  )
}

export default PromptSystemForm
