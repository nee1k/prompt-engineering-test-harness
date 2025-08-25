import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  MenuItem,
  Grid,
  Button,
  Stack,
  Alert,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'

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
    <Stack spacing={2}>
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'}>
          {message}
        </Alert>
      )}

      <Card>
        <CardHeader title="Compare Models" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Prompt Template"
                name="template"
                value={promptTemplate}
                onChange={e => setPromptTemplate(e.target.value)}
                required
                placeholder="Enter prompt template with {variable} placeholders"
                multiline
                minRows={4}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Upload Regression Set (CSV or JSONL)</Typography>
                <Button
                  variant="outlined"
                  onClick={() => document.getElementById('regression-file-input').click()}
                  disabled={loading}
                >
                  {regressionFile ? regressionFile.name : 'Select file'}
                </Button>
                <input
                  id="regression-file-input"
                  type="file"
                  accept=".csv,.jsonl"
                  onChange={handleRegressionFileUpload}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
              </Stack>
              {regressionSet.length > 0 && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Preview ({regressionSet.length} samples)</Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 180, overflow: 'auto', p: 1, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify(regressionSet.slice(0, 3), null, 2)}</pre>
                  </Paper>
                  {regressionSet.length > 3 && (
                    <Typography variant="caption" color="text.secondary">... and {regressionSet.length - 3} more samples</Typography>
                  )}
                </Stack>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Evaluation Function"
                value={selectedEvaluationFunction}
                onChange={(e) => setSelectedEvaluationFunction(e.target.value)}
                required
              >
                {evaluationFunctions.map((func) => (
                  <MenuItem key={func.id} value={func.id}>
                    {func.name} - {func.description}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Select Model to Compare"
                value=""
                onChange={e => {
                  const modelId = e.target.value;
                  if (modelId && !selectedModels.includes(modelId)) {
                    setSelectedModels([...selectedModels, modelId]);
                  }
                }}
              >
                <MenuItem value="">Choose a model...</MenuItem>
                {Object.entries(availableModels).map(([provider, models]) =>
                  models.map(model => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name} ({getProviderName(provider)})
                    </MenuItem>
                  ))
                )}
              </TextField>
              {selectedModels.length > 0 && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Selected Models</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedModels.map(modelId => {
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
                        <Chip
                          key={modelId}
                          label={`${foundModel.name} (${getProviderName(foundProvider)})`}
                          onDelete={() => setSelectedModels(selectedModels.filter(id => id !== modelId))}
                        />
                      );
                    })}
                  </Stack>
                  <Stack direction="row">
                    <Button size="small" variant="outlined" onClick={() => setSelectedModels([])}>Clear All</Button>
                  </Stack>
                </Stack>
              )}
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  disabled={loading || !promptTemplate || selectedModels.length === 0 || regressionSet.length === 0}
                  onClick={handleRunComparison}
                >
                  {loading ? 'Running Comparison...' : 'Compare Models'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {comparisonResults.length > 0 && (
        <Card>
          <CardHeader title="Comparison Results" />
          <CardContent>
            <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
              <Typography>
                <strong>Models Tested:</strong> {comparisonResults.length}
              </Typography>
              <Typography>
                <strong>Best Score:</strong>{' '}
                {((Math.max(...comparisonResults.map(r => r.avg_score || 0)) || 0) * 100).toFixed(1)}%
              </Typography>
            </Stack>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Average Score</TableCell>
                    <TableCell>Total Samples</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonResults
                    .slice()
                    .sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0))
                    .map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatModelName(result.model)}</TableCell>
                        <TableCell>{getProviderName(result.provider)}</TableCell>
                        <TableCell>{((result.avg_score || 0) * 100).toFixed(1)}%</TableCell>
                        <TableCell>{result.total_samples}</TableCell>
                        <TableCell>
                          <Chip size="small" color={result.status === 'completed' ? 'success' : 'default'} label={result.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}

export default CompareModels
