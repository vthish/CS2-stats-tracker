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

    if (!steamInput) {
      setError('Please enter a Steam ID or Profile Name');
      return;
    }

    setError('');
    setStats(null);
    setProfilePlaytime(0);
    setLoading(true);

    try {
      let url = '';
      const trimmedInput = steamInput.trim();

      if (/^\d{17}$/.test(trimmedInput)) {
        url = `/.netlify/functions/getStats?steamid=${trimmedInput}`;
      } else {
        url = `/.netlify/functions/getStats?vanityurl=${trimmedInput}`;
      }

      const response = await axios.get(url);
      
      if (response.data && response.data.playerstats) {
        setStats(response.data.playerstats.stats);
        setProfilePlaytime(response.data.playtime_forever);
      } else {
        setError('No CS2 stats found. Make sure the profile is public.');
      }
    } catch (err) {
      setError('Error fetching data. Profile might be private or API issue.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              {/* Correct Profile Playtime (from minutes to hours) */}
              <div className="stat-card" style={{borderLeftColor: '#10b981'}}>
                <span className="stat-name">Steam Profile Playtime</span>
                <span className="stat-value">{(profilePlaytime / 60).toFixed(1)}h</span>
              </div>

              {/* Combat Stats Grid */}
              {stats.slice(0, 20).map((stat, index) => {
                // Skipping the inaccurate total_time_played from combat stats
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