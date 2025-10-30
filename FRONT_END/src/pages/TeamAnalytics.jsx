import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/TeamAnalytics.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function TeamAnalytics({ onBack }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/analytics/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="team-analytics">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="team-analytics">
        <div className="error">Failed to load analytics data</div>
      </div>
    );
  }

  const { overall, daily_stats, department_performance } = analyticsData;

  return (
    <div className="team-analytics">
      {/* Header */}
      <div className="analytics-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h1>📊 Analytics Dashboard</h1>
        <p className="subtitle">Performance metrics and insights</p>
      </div>

      {/* Overall Metrics */}
      <div className="metrics-section">
        <h2>Overall Performance</h2>
        <div className="metrics-grid">
          <div className="metric-card total">
            <div className="metric-icon">📋</div>
            <div className="metric-info">
              <h3>{overall.total_incidents}</h3>
              <p>Total Incidents</p>
            </div>
          </div>

          <div className="metric-card resolved">
            <div className="metric-icon">✅</div>
            <div className="metric-info">
              <h3>{overall.resolved_incidents}</h3>
              <p>Resolved</p>
            </div>
          </div>

          <div className="metric-card active">
            <div className="metric-icon">🔥</div>
            <div className="metric-info">
              <h3>{overall.active_incidents}</h3>
              <p>Active</p>
            </div>
          </div>

          <div className="metric-card response">
            <div className="metric-icon">⏱️</div>
            <div className="metric-info">
              <h3>{overall.average_response_time} min</h3>
              <p>Avg Response Time</p>
            </div>
          </div>

          <div className="metric-card resolution">
            <div className="metric-icon">📈</div>
            <div className="metric-info">
              <h3>{overall.resolution_rate}%</h3>
              <p>Resolution Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="department-section">
        <h2>Department Performance</h2>
        <div className="department-grid">
          {Object.entries(department_performance).map(([dept, stats]) => (
            <div key={dept} className="department-card">
              <h3>{dept}</h3>
              <div className="dept-stats">
                <div className="dept-stat">
                  <span className="stat-label">Total:</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
                <div className="dept-stat">
                  <span className="stat-label">Resolved:</span>
                  <span className="stat-value resolved">{stats.resolved}</span>
                </div>
                <div className="dept-stat">
                  <span className="stat-label">Active:</span>
                  <span className="stat-value active">{stats.active}</span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <p className="resolution-text">
                {stats.total > 0
                  ? `${Math.round((stats.resolved / stats.total) * 100)}% Resolution Rate`
                  : "No incidents"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Statistics */}
      <div className="daily-section">
        <h2>Last 30 Days Statistics</h2>
        {daily_stats && daily_stats.length > 0 ? (
          <div className="daily-grid">
            {daily_stats.slice(0, 10).map((stat) => (
              <div key={stat.id} className="daily-card">
                <div className="daily-header">
                  <span className="daily-date">
                    {new Date(stat.date).toLocaleDateString()}
                  </span>
                  <span className="daily-rate">{stat.resolution_rate}%</span>
                </div>
                <div className="daily-stats">
                  <div className="daily-stat">
                    <span className="stat-icon">📋</span>
                    <span className="stat-number">{stat.total_incidents}</span>
                    <span className="stat-text">Total</span>
                  </div>
                  <div className="daily-stat">
                    <span className="stat-icon">✅</span>
                    <span className="stat-number">{stat.resolved_incidents}</span>
                    <span className="stat-text">Resolved</span>
                  </div>
                  <div className="daily-stat">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-number">{stat.average_response_time}</span>
                    <span className="stat-text">Avg Time (min)</span>
                  </div>
                </div>
                {(stat.critical_incidents > 0 || stat.high_priority_incidents > 0) && (
                  <div className="priority-indicators">
                    {stat.critical_incidents > 0 && (
                      <span className="priority-badge critical">
                        🚨 {stat.critical_incidents} Critical
                      </span>
                    )}
                    {stat.high_priority_incidents > 0 && (
                      <span className="priority-badge high">
                        ⚠️ {stat.high_priority_incidents} High
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No daily statistics available</div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="analytics-footer">
        <button onClick={fetchAnalytics} className="refresh-btn">
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
