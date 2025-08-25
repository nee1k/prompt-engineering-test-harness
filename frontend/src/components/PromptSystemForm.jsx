import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  MenuItem,
  Grid,
  Button,
  Stack,
  Alert
} from '@mui/material'
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
    <Card sx={{ maxWidth: 900, mx: 'auto' }}>
      <CardHeader title="Create Prompt System" />
      <CardContent>
        <Stack spacing={2}>
          {message && (
            <Alert severity={message.includes('Error') ? 'error' : 'success'}>
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter system name"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Prompt Template"
                  name="template"
                  value={formData.template}
                  onChange={handleChange}
                  required
                  placeholder="Enter prompt template with {variable} placeholders"
                  multiline
                  minRows={4}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Variables (comma-separated)"
                  name="variables"
                  value={formData.variables}
                  onChange={handleChange}
                  required
                  placeholder="e.g., text, language, style"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleProviderChange}
                  select
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="ollama">Ollama (Local)</MenuItem>
                </TextField>
                {formData.provider === 'ollama' && ollamaStatus && (
                  <Typography variant="body2" sx={{ mt: 1 }} color={ollamaStatus.status === 'running' ? 'success.main' : 'error.main'}>
                    {ollamaStatus.status === 'running' ? '✓ Ollama is running' : '✗ Ollama is not running'}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  select
                >
                  {getCurrentModels().map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Temperature"
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Max Tokens"
                  type="number"
                  name="max_tokens"
                  value={formData.max_tokens}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 4000 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Top P"
                  type="number"
                  name="top_p"
                  value={formData.top_p}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Prompt System'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default PromptSystemForm
