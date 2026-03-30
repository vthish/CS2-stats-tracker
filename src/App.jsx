import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [steamInput, setSteamInput] = useState('');
  const [stats, setStats] = useState(null);
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
      } else {
        setError('No CS2 stats found. Make sure the profile is public.');
      }
    } catch (err) {
      setError('Error fetching data. Profile might be private or doesn\'t exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <h1 className="title-glow">CS2 Stats Tracker</h1>
        <p className="subtitle">Enter SteamID64 or Custom Profile Name</p>
        
        <form className="search-box" onSubmit={fetchStats}>
          <input 
            type="text" 
            placeholder="e.g., 76561198000000000 or name" 
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search Stats'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
        {loading && <div className="loader"></div>}

        {stats && !loading && (
          <div className="stats-container fade-in">
            <h2>Combat Statistics</h2>
            <div className="stats-grid">
              {stats.slice(0, 15).map((stat, index) => (
                <div className="stat-card" key={index}>
                  <span className="stat-name">{stat.name.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="stat-value">{stat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;