import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unresolved, resolved

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/alerts/`);
      setAlerts(response.data);
    } catch (error) {
      setError('Failed to fetch alerts');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await axios.put(`${API_BASE}/alerts/${alertId}/resolve`);
      fetchAlerts();
    } catch (error) {
      setError('Failed to resolve alert');
      console.error('Error:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'score_drop': return '📉';
      case 'output_change': return '🔄';
      case 'failure': return '❌';
      default: return '⚠️';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unresolved') return !alert.is_resolved;
    if (filter === 'resolved') return alert.is_resolved;
    return true;
  });

  if (loading) return <div>Loading alerts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="alerts">
      <div className="header">
        <h2>Alerts</h2>
        <div className="filters">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All ({alerts.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'unresolved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('unresolved')}
          >
            Unresolved ({alerts.filter(a => !a.is_resolved).length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({alerts.filter(a => a.is_resolved).length})
          </button>
        </div>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <p>No alerts found.</p>
        ) : (
          <div className="alerts-grid">
            {filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-card ${alert.is_resolved ? 'resolved' : ''}`}
                style={{ borderLeft: `4px solid ${getSeverityColor(alert.severity)}` }}
              >
                <div className="alert-header">
                  <span className="alert-icon">
                    {getAlertTypeIcon(alert.alert_type)}
                  </span>
                  <span className={`severity-badge severity-${alert.severity}`}>
                    {alert.severity}
                  </span>
                  <span className="alert-time">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <p className="alert-system">
                    System: {alert.test_run?.prompt_system?.name || 'Unknown'}
                  </p>
                </div>

                <div className="alert-actions">
                  {!alert.is_resolved && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                  {alert.is_resolved && (
                    <span className="resolved-badge">✓ Resolved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Alerts;
