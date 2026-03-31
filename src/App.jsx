import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [steamInput, setSteamInput] = useState('');
  const [stats, setStats] = useState(null);
  const [profilePlaytime, setProfilePlaytime] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cs2_recent_searches')) || [];
    setRecentSearches(saved);
  }, []);

  const saveToHistory = (id) => {
    let updated = [id, ...recentSearches.filter(item => item !== id)];
    updated = updated.slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('cs2_recent_searches', JSON.stringify(updated));
  };

  const fetchStats = async (e, directId = null) => {
    if (e) e.preventDefault();
    const targetId = directId || steamInput.trim();
    if (!targetId) return;

    setError('');
    setStats(null);
    setLoading(true);

    try {
      const url = /^\d{17}$/.test(targetId) 
        ? `/.netlify/functions/getStats?steamid=${targetId}`
        : `/.netlify/functions/getStats?vanityurl=${targetId}`;

      const response = await axios.get(url);
      
      if (response.data && response.data.playerstats) {
        setStats(response.data.playerstats.stats);
        setProfilePlaytime(response.data.playtime_forever || 0);
        saveToHistory(targetId);
        if (!directId) setSteamInput('');
      } else {
        setError('No stats found. Is the profile public?');
      }
    } catch (err) {
      setError('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (name, value) => {
    if (name === 'total_money_earned') return `$${value.toLocaleString()}`;
    return value.toLocaleString();
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <h1 className="title-glow">CS2 Tracker</h1>
        
        {recentSearches.length > 0 && (
          <div className="recent-searches">
            {recentSearches.map((id, idx) => (
              <button key={idx} onClick={() => fetchStats(null, id)} className="history-tag">
                {id}
              </button>
            ))}
          </div>
        )}

        <form className="search-box" onSubmit={fetchStats}>
          <input 
            type="text" 
            placeholder="SteamID64 or Custom Name" 
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
        {loading && <div className="loader"></div>}

        {stats && !loading && (
          <div className="stats-container fade-in">
            <div className="stats-grid">
              
              <div className="stat-card special-card">
                <span className="stat-name">Total Playtime</span>
                <span className="stat-value">{(profilePlaytime / 60).toFixed(1)}h</span>
              </div>

              {stats.slice(0, 15).map((stat, index) => {
                if (stat.name === 'total_time_played') return null;
                return (
                  <div className="stat-card" key={index}>
                    <span className="stat-name">{stat.name.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="stat-value">{formatValue(stat.name, stat.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;