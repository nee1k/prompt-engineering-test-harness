import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

function TestHistory() {
  const [promptSystems, setPromptSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchPromptSystems();
  }, []);

  useEffect(() => {
    if (selectedSystem) {
      fetchHistory();
    }
  }, [selectedSystem, days]);

  const fetchPromptSystems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/prompt-systems/`);
      setPromptSystems(response.data);
    } catch (error) {
      console.error('Error fetching prompt systems:', error);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/test-runs/${selectedSystem}/history?days=${days}`);
      setHistory(response.data);
    } catch (error) {
      setError('Failed to fetch history');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAverageScore = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, run) => sum + (run.avg_score || 0), 0);
    return (total / history.length).toFixed(2);
  };

  const getTotalRuns = () => {
    return history.length;
  };

  const getTrend = () => {
    if (history.length < 2) return 'stable';
    const recent = history.slice(-3);
    const older = history.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, run) => sum + (run.avg_score || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, run) => sum + (run.avg_score || 0), 0) / older.length;
    
    if (recentAvg > olderAvg + 0.1) return 'improving';
    if (recentAvg < olderAvg - 0.1) return 'declining';
    return 'stable';
  };



  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="test-history">
      <div className="header">
        <h2>Test History</h2>
        <div className="controls">
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="form-control"
          >
            <option value="">Select a prompt system</option>
            {promptSystems.map(system => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>
          
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="form-control"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {selectedSystem && (
        <>
          {loading ? (
            <div>Loading history...</div>
          ) : (
            <>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Average Score</h3>
                  <div className="metric-value">{getAverageScore()}</div>
                </div>
                <div className="metric-card">
                  <h3>Total Runs</h3>
                  <div className="metric-value">{getTotalRuns()}</div>
                </div>
                <div className="metric-card">
                  <h3>Trend</h3>
                  <div className={`metric-value trend-${getTrend()}`}>
                    {getTrend().charAt(0).toUpperCase() + getTrend().slice(1)}
                  </div>
                </div>
              </div>



              <div className="history-table">
                <h3>Recent Test Runs</h3>
                {history.length === 0 ? (
                  <p>No test runs found in the selected time period.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Samples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(run => (
                        <tr key={run.id}>
                          <td>{new Date(run.created_at).toLocaleString()}</td>
                          <td>{(run.avg_score || 0).toFixed(2)}</td>
                          <td>{run.total_samples || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default TestHistory;
