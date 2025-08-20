import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

function TestSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [promptSystems, setPromptSystems] = useState([]);
  const [evaluationFunctions, setEvaluationFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createScheduleModal, setCreateScheduleModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    prompt_system_id: '',
    name: '',
    interval_seconds: 3600,
    evaluation_function: 'fuzzy',
    email_notifications: false,
    email_recipients: '',
    alert_threshold: 0.2
  });

  useEffect(() => {
    fetchSchedules();
    fetchPromptSystems();
    fetchEvaluationFunctions();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${API_BASE}/test-schedules/`);
      setSchedules(response.data);
    } catch (error) {
      setError('Failed to fetch schedules');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromptSystems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/prompt-systems/`);
      setPromptSystems(response.data);
    } catch (error) {
      console.error('Error fetching prompt systems:', error);
    }
  };

  const fetchEvaluationFunctions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/evaluation-functions/`);
      setEvaluationFunctions(response.data.evaluation_functions);
    } catch (error) {
      console.error('Error fetching evaluation functions:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a regression set file');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);

      // Upload regression set
      const uploadResponse = await axios.post(`${API_BASE}/upload-regression-set/`, formDataToSend);
      const regressionSet = uploadResponse.data.regression_set;

      // Process email recipients
      const emailRecipients = formData.email_notifications && formData.email_recipients
        ? formData.email_recipients.split(',').map(email => email.trim()).filter(email => email)
        : [];

      // Create schedule
      const scheduleData = {
        ...formData,
        email_recipients: emailRecipients,
        regression_set: regressionSet
      };

      await axios.post(`${API_BASE}/test-schedules/`, scheduleData);
      
      setCreateScheduleModal(false);
      setFormData({ 
        prompt_system_id: '', 
        name: '', 
        interval_seconds: 3600, 
        evaluation_function: 'fuzzy',
        email_notifications: false,
        email_recipients: '',
        alert_threshold: 0.2
      });
      setSelectedFile(null);
      fetchSchedules();
    } catch (error) {
      setError('Failed to create schedule');
      console.error('Error:', error);
    }
  };

  const toggleSchedule = async (scheduleId) => {
    try {
      await axios.put(`${API_BASE}/test-schedules/${scheduleId}/toggle`);
      fetchSchedules();
    } catch (error) {
      setError('Failed to toggle schedule');
      console.error('Error:', error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/test-schedules/${scheduleId}`);
      fetchSchedules();
    } catch (error) {
      setError('Failed to delete schedule');
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading schedules...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="schedules-container">



      {/* Create Schedule Modal */}
      {createScheduleModal && (
        <div className="modal-overlay" onClick={() => setCreateScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Create New Schedule</h3>
              <button 
                className="btn-close"
                onClick={() => setCreateScheduleModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="schedule-form">
            <div className="form-group">
              <label>Prompt System:</label>
              <select
                name="prompt_system_id"
                value={formData.prompt_system_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a prompt system</option>
                {promptSystems.map(system => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Schedule Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Daily Translation Test"
                required
              />
            </div>

            <div className="form-group">
              <label>Interval (seconds):</label>
              <input
                type="number"
                name="interval_seconds"
                value={formData.interval_seconds}
                onChange={handleInputChange}
                min="1"
                max="86400"
                required
              />
              <small>Enter 1 for 1 second, 3600 for 1 hour, etc.</small>
            </div>

            <div className="form-group">
              <label>Evaluation Function:</label>
              <select
                name="evaluation_function"
                value={formData.evaluation_function}
                onChange={handleInputChange}
                required
              >
                {evaluationFunctions.map((func) => (
                  <option key={func.id} value={func.id}>
                    {func.name} - {func.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    name="email_notifications"
                    checked={formData.email_notifications}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email_notifications: e.target.checked
                    }))}
                    className="checkbox-input"
                  />
                  <div className="checkbox-custom">
                    <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <span className="checkbox-text">Enable Email Notifications</span>
              </label>
            </div>

            {formData.email_notifications && (
              <>
                <div className="form-group">
                  <label>Email Recipients (comma-separated):</label>
                  <input
                    type="text"
                    name="email_recipients"
                    value={formData.email_recipients}
                    onChange={handleInputChange}
                    placeholder="user1@example.com, user2@example.com"
                    required={formData.email_notifications}
                  />
                  <small>Enter email addresses separated by commas</small>
                </div>

                <div className="form-group">
                  <label>Alert Threshold (score drop %):</label>
                  <input
                    type="number"
                    name="alert_threshold"
                    value={formData.alert_threshold}
                    onChange={handleInputChange}
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    required={formData.email_notifications}
                  />
                  <small>Send alert when score drops by this percentage (e.g., 0.2 = 20%)</small>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Regression Set File:</label>
              <div className="file-upload-container">
                <div className="file-upload" onClick={() => document.getElementById('schedule-file-input').click()}>
                  <input
                    id="schedule-file-input"
                    type="file"
                    accept=".csv,.jsonl"
                    onChange={handleFileChange}
                    required
                    style={{ display: 'none' }}
                  />
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div className="upload-content">
                    <p className="upload-title">
                      {selectedFile ? selectedFile.name : 'Click to select file'}
                    </p>
                    <p className="upload-description">
                      File should contain columns for variables and an 'expected_output' column
                    </p>
                    {!selectedFile && (
                      <p className="upload-hint">
                        Supports .csv and .jsonl files
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <span className="btn-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </span>
                Create Schedule
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      <div className="schedules-list-container">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
              </svg>
            </div>
            <h3>No schedules found</h3>
            <p>Create your first schedule to automate testing</p>
          </div>
        ) : (
          <div className="schedules-table-container">
            <table className="schedules-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prompt System</th>
                  <th>Interval</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Next Run</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(schedule => (
                  <tr key={schedule.id} className="schedule-row">
                    <td className="schedule-name">{schedule.name}</td>
                    <td className="system-name">{schedule.prompt_system?.name || 'Unknown'}</td>
                    <td className="interval">Every {schedule.interval_seconds} second(s)</td>
                    <td className="status-cell">
                      <span className={`status-badge ${schedule.is_active ? 'active' : 'inactive'}`}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="last-run">
                      {schedule.last_run_at 
                        ? new Date(schedule.last_run_at).toLocaleString()
                        : 'Never'
                      }
                    </td>
                    <td className="next-run">
                      {schedule.next_run_at 
                        ? new Date(schedule.next_run_at).toLocaleString()
                        : 'N/A'
                      }
                    </td>
                    <td className="actions">
                      <div className="action-buttons">
                        <button
                          className={`btn btn-sm ${schedule.is_active ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => toggleSchedule(schedule.id)}
                          title={schedule.is_active ? 'Pause Schedule' : 'Resume Schedule'}
                        >
                          {schedule.is_active ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteSchedule(schedule.id)}
                          title="Delete Schedule"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Create Schedule Button */}
      <div className="create-schedule-section">
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setCreateScheduleModal(true)}
        >
          Create New Schedule
        </button>
      </div>
    </div>
  );
}

export default TestSchedules;
