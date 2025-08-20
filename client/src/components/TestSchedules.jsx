import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

function TestSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [promptSystems, setPromptSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    prompt_system_id: '',
    name: '',
    interval_seconds: 3600
  });

  useEffect(() => {
    fetchSchedules();
    fetchPromptSystems();
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

      // Create schedule
      const scheduleData = {
        ...formData,
        regression_set: regressionSet
      };

      await axios.post(`${API_BASE}/test-schedules/`, scheduleData);
      
      setShowCreateForm(false);
                  setFormData({ prompt_system_id: '', name: '', interval_seconds: 3600 });
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
    <div className="test-schedules">
      <div className="header">
        <h2>Test Schedules</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Schedule'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Schedule</h3>
          <form onSubmit={handleSubmit}>
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
              <label>Regression Set File:</label>
              <input
                type="file"
                accept=".csv,.jsonl"
                onChange={handleFileChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Create Schedule
            </button>
          </form>
        </div>
      )}

      <div className="schedules-list">
        {schedules.length === 0 ? (
          <p>No schedules found. Create one to get started!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Prompt System</th>
                <th>Interval</th>
                <th>Status</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(schedule => (
                <tr key={schedule.id}>
                  <td>{schedule.name}</td>
                  <td>{schedule.prompt_system?.name || 'Unknown'}</td>
                  <td>Every {schedule.interval_hours * 3600} second(s)</td>
                  <td>
                    <span className={`status ${schedule.is_active ? 'active' : 'inactive'}`}>
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {schedule.last_run_at 
                      ? new Date(schedule.last_run_at).toLocaleString()
                      : 'Never'
                    }
                  </td>
                  <td>
                    {schedule.next_run_at 
                      ? new Date(schedule.next_run_at).toLocaleString()
                      : 'N/A'
                    }
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${schedule.is_active ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleSchedule(schedule.id)}
                    >
                      {schedule.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TestSchedules;
