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
  TableRow
} from '@mui/material'

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
    <Stack spacing={2}>
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'}>
          {message}
        </Alert>
      )}

      <Card>
        <CardHeader title="Run Test" />
        <CardContent>
          <form onSubmit={handleRunTest}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Select Prompt System"
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  required
                >
                  <MenuItem value="">Choose a prompt system...</MenuItem>
                  {promptSystems.map((system) => (
                    <MenuItem key={system.id} value={system.id}>
                      {system.name} ({system.model})
                    </MenuItem>
                  ))}
                </TextField>
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

              <Grid item xs={12}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Upload Regression Set (CSV or JSONL)</Typography>
                  <Button
                    variant="outlined"
                    onClick={() => document.getElementById('file-input').click()}
                    disabled={loading}
                  >
                    {file ? file.name : 'Select file'}
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.jsonl"
                    onChange={handleFileUpload}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                </Stack>
              </Grid>

              {regressionSet.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Preview ({regressionSet.length} samples)</Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 180, overflow: 'auto', p: 1, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify(regressionSet.slice(0, 3), null, 2)}</pre>
                  </Paper>
                  {regressionSet.length > 3 && (
                    <Typography variant="caption" color="text.secondary">... and {regressionSet.length - 3} more samples</Typography>
                  )}
                </Grid>
              )}

              <Grid item xs={12}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button type="submit" variant="contained" disabled={loading || !selectedSystem || regressionSet.length === 0}>
                    {loading ? 'Running Test...' : 'Run Test'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader title="Test Results" />
          <CardContent>
            <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
              <Typography>
                <strong>Average Score:</strong>{' '}
                <span>{(testResult.avg_score * 100).toFixed(1)}%</span>
              </Typography>
              <Typography>
                <strong>Total Samples:</strong>{' '}
                <span>{testResult.total_samples}</span>
              </Typography>
            </Stack>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sample</TableCell>
                    <TableCell>Expected Output</TableCell>
                    <TableCell>Predicted Output</TableCell>
                    <TableCell>Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResult.results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.sample_id}</TableCell>
                      <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>{result.expected_output}</TableCell>
                      <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>{result.predicted_output}</TableCell>
                      <TableCell>{(result.score * 100).toFixed(1)}%</TableCell>
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

export default TestRunForm
