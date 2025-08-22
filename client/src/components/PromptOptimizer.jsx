import React, { useState, useEffect } from 'react'
import './PromptOptimizer.css'

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
  const [optimizationResults, setOptimizationResults] = useState([])
  const [currentIteration, setCurrentIteration] = useState(0)
  const [totalCost, setTotalCost] = useState(0.0)

  useEffect(() => {
    fetchPromptSystems()
  }, [])

  const fetchPromptSystems = async () => {
    try {
      const response = await fetch('/api/prompt-systems/')
      const data = await response.json()
      setPromptSystems(data)
    } catch (error) {
      console.error('Error fetching prompt systems:', error)
    }
  }

  const startOptimization = async () => {
    if (!selectedSystem) {
      alert('Please select a prompt system to optimize')
      return
    }

    setIsOptimizing(true)
    setCurrentIteration(0)
    setTotalCost(0.0)
    setOptimizationResults([])

    try {
      const response = await fetch('/api/prompt-optimizer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptSystemId: selectedSystem,
          config: optimizationConfig
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Optimization started:', result)
        // Start polling for results
        pollOptimizationResults(result.optimizationId)
      } else {
        throw new Error('Failed to start optimization')
      }
    } catch (error) {
      console.error('Error starting optimization:', error)
      setIsOptimizing(false)
    }
  }

  const pollOptimizationResults = async (optimizationId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/prompt-optimizer/${optimizationId}/status`)
        const data = await response.json()

        setCurrentIteration(data.currentIteration)
        setTotalCost(data.totalCost)
        setOptimizationResults(data.results || [])

        if (data.status === 'completed' || data.status === 'failed') {
          setIsOptimizing(false)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error polling optimization results:', error)
        setIsOptimizing(false)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds
  }

  const stopOptimization = async () => {
    try {
      await fetch('/api/prompt-optimizer/stop', {
        method: 'POST'
      })
      setIsOptimizing(false)
    } catch (error) {
      console.error('Error stopping optimization:', error)
    }
  }

  return (
    <div className="prompt-optimizer">

      <div className="optimization-container">
        <div className="optimization-setup">
          <h3>Optimization Setup</h3>
          
          <div className="form-group">
            <label>Select Prompt System:</label>
            <select 
              value={selectedSystem} 
              onChange={(e) => setSelectedSystem(e.target.value)}
              disabled={isOptimizing}
            >
              <option value="">Choose a prompt system...</option>
              {promptSystems.map(system => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>

          <div className="optimization-params">
            <div className="params-grid">
              <div className="form-group">
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

              <div className="form-group">
                <label>Evaluation Method:</label>
                <select
                  value={optimizationConfig.evaluationMethod}
                  onChange={(e) => setOptimizationConfig({
                    ...optimizationConfig,
                    evaluationMethod: e.target.value
                  })}
                  disabled={isOptimizing}
                >
                  <option value="fuzzy">Fuzzy Match</option>
                  <option value="exact">Exact Match</option>
                  <option value="semantic">Semantic Similarity</option>
                  <option value="contains">Contains</option>
                </select>
              </div>
            </div>
          </div>

          <div className="budget-controls">

            <div className="budget-grid">
              <div className="form-group">
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

              <div className="form-group">
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
          </div>

          <div className="optimization-actions">
            {!isOptimizing ? (
              <button 
                className="btn btn-primary"
                onClick={startOptimization}
                disabled={!selectedSystem}

              >
                Optimize Prompt
              </button>
            ) : (
              <button 
                className="btn btn-danger"
                onClick={stopOptimization}
              >
                Stop Optimization
              </button>
            )}
          </div>
        </div>

        <div className="optimization-progress">
          <h3>Optimization Progress</h3>
          
          {isOptimizing && (
            <div className="progress-info">
              <div className="progress-item">
                <span>Current Iteration:</span>
                <span>{currentIteration} / {optimizationConfig.maxIterations}</span>
              </div>
              <div className="progress-item">
                <span>Total Cost:</span>
                <span>${totalCost.toFixed(2)} / ${optimizationConfig.costBudget}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(currentIteration / optimizationConfig.maxIterations) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {optimizationResults.length > 0 && (
            <div className="optimization-results">
              <div
                className="results-list"
                style={{
                  maxHeight: "500px",
                  overflowY: "auto"
                }}
              >
                {optimizationResults.slice(0, 5).map((result, index) => (
                  <div key={index} className="result-item">
                    <div className="result-header">
                      <span className="result-score">Score: {result.score.toFixed(3)}</span>
                      <span className="result-iteration">Iteration: {result.iteration}</span>
                    </div>
                    <div className="result-prompt">
                      <strong>Prompt:</strong>
                      <pre>{result.prompt}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptOptimizer
