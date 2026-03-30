import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [steamId, setSteamId] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 


  const API_KEY = '169DF1566DD9F3A0FD12DD8AA1736FFA'; 
  const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

  const fetchStats = async () => {
    if (!steamId) {
      setError('Please enter a valid SteamID64');
      return;
    }

    setError('');
    setStats(null);
    setLoading(true);

    try {
      const targetUrl = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${API_KEY}&steamid=${steamId}`;
      const response = await axios.get(PROXY_URL + targetUrl);
      
      if (response.data && response.data.playerstats) {
        setStats(response.data.playerstats.stats);
      } else {
        setError('No CS2 stats found for this Steam ID. Make sure the profile is public.');
      }
    } catch (err) {
      setError('Error fetching data. Please check the Steam ID or API Key.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <h1 className="title-glow">CS2 Stats Tracker</h1>
        <p className="subtitle">Enter a SteamID64 to analyze performance</p>
        
        <div className="search-box">
          <input 
            type="text" 
            placeholder="e.g., 76561198000000000" 
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
          />
          <button onClick={fetchStats} disabled={loading}>
            {loading ? 'Searching...' : 'Search Stats'}
          </button>
        </div>

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