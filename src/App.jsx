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

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cs2_recent_searches')) || [];
    setRecentSearches(saved);
  }, []);

  const saveToHistory = (id) => {
    let updated = [id, ...recentSearches.filter(item => item !== id)];
    updated = updated.slice(0, 5); // Keep only last 5 searches
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
        if (!directId) setSteamInput(''); // Clear input if it was manual search
      } else {
        setError('No stats found. Is the profile public?');
      }
    } catch (err) {
      setError('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const getTopWeapon = () => {
    if (!stats) return null;
    const weapons = stats.filter(s => s.name.startsWith('total_kills_') && !s.name.includes('headshot') && !s.name.includes('enemy'));
    if (weapons.length === 0) return null;
    const top = weapons.reduce((prev, current) => (prev.value > current.value) ? prev : current);
    return {
      name: top.name.replace('total_kills_', '').toUpperCase(),
      kills: top.value
    };
  };

  const topWeapon = getTopWeapon();

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <h1 className="title-glow">CS2 Tracker</h1>
        
        {/* Recent Searches Section */}
        {recentSearches.length > 0 && (
          <div className="recent-searches">
            <span>Recent:</span>
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
              
              {/* Highlight: Real Playtime */}
              <div className="stat-card highlight-blue">
                <span className="stat-name">Total Playtime</span>
                <span className="stat-value">{(profilePlaytime / 60).toFixed(1)}h</span>
              </div>

              {/* Highlight: Top Weapon */}
              {topWeapon && (
                <div className="stat-card highlight-gold">
                  <span className="stat-name">Signature Weapon</span>
                  <span className="stat-value">{topWeapon.name}</span>
                  <span className="sub-value">{topWeapon.kills.toLocaleString()} Kills</span>
                </div>
              )}

              {stats.slice(0, 14).map((stat, index) => {
                if (stat.name === 'total_time_played' || stat.name.startsWith('total_kills_')) return null;
                return (
                  <div className="stat-card" key={index}>
                    <span className="stat-name">{stat.name.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="stat-value">{stat.value.toLocaleString()}</span>
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