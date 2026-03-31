import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [steamInput, setSteamInput] = useState('');
  const [stats, setStats] = useState(null);
  const [profilePlaytime, setProfilePlaytime] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStats = async (e) => {
    if (e) e.preventDefault();
    if (!steamInput) { setError('Please enter a Steam ID or Profile Name'); return; }

    setError('');
    setStats(null);
    setProfilePlaytime(0);
    setLoading(true);

    try {
      const trimmedInput = steamInput.trim();
      const url = /^\d{17}$/.test(trimmedInput) 
        ? `/.netlify/functions/getStats?steamid=${trimmedInput}`
        : `/.netlify/functions/getStats?vanityurl=${trimmedInput}`;

      const response = await axios.get(url);
      
      if (response.data && response.data.playerstats) {
        setStats(response.data.playerstats.stats);
        // Getting playtime from profile API
        setProfilePlaytime(response.data.playtime_forever || 0);
      } else {
        setError('No CS2 stats found. Make sure the profile is public.');
      }
    } catch (err) {
      setError('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  // Logic to determine best playtime value
  const getDisplayPlaytime = () => {
    if (profilePlaytime > 0) {
      return (profilePlaytime / 60).toFixed(1) + "h";
    }
    // Fallback to in-game stats if profile playtime is private/0
    const inGameTime = stats?.find(s => s.name === 'total_time_played')?.value || 0;
    return inGameTime > 0 ? (inGameTime / 3600).toFixed(1) + "h" : "0.0h";
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <h1 className="title-glow">CS2 Tracker</h1>
        <p className="subtitle">Search player stats instantly</p>
        
        <form className="search-box" onSubmit={fetchStats}>
          <input 
            type="text" 
            placeholder="SteamID64 or Custom Name" 
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
        {loading && <div className="loader"></div>}

        {stats && !loading && (
          <div className="stats-container fade-in">
            <div className="stats-grid">
              {/* Special Playtime Card with Fallback */}
              <div className="stat-card" style={{borderLeftColor: '#10b981'}}>
                <span className="stat-name">Total Playtime</span>
                <span className="stat-value">{getDisplayPlaytime()}</span>
              </div>

              {stats.slice(0, 15).map((stat, index) => {
                if (stat.name === 'total_time_played') return null;
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