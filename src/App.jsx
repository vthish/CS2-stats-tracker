import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [steamInput, setSteamInput] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_KEY = 'import.meta.env.VITE_STEAM_API_KEY'; 
  const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

  const fetchStats = async () => {
    if (!steamInput) {
      setError('Please enter a Steam ID or Profile Name');
      return;
    }

    setError('');
    setStats(null);
    setLoading(true);

    try {
      let finalSteamId = steamInput.trim();

      if (!/^\d{17}$/.test(finalSteamId)) {
        const resolveUrl = `${PROXY_URL}http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${API_KEY}&vanityurl=${finalSteamId}`;
        const resolveRes = await axios.get(resolveUrl);

        if (resolveRes.data && resolveRes.data.response && resolveRes.data.response.success === 1) {
          finalSteamId = resolveRes.data.response.steamid;
        } else {
          setError('Could not find a Steam profile with that name.');
          setLoading(false);
          return;
        }
      }

      const statsUrl = `${PROXY_URL}http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${API_KEY}&steamid=${finalSteamId}`;
      const response = await axios.get(statsUrl);
      
      if (response.data && response.data.playerstats) {
        setStats(response.data.playerstats.stats);
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
        <h1 className="title-glow">CS2 Stats Tracker</h1>
        <p className="subtitle">Enter SteamID64 or Custom Profile Name</p>
        
        <div className="search-box">
          <input 
            type="text" 
            placeholder="e.g., 76561198000000000 or s1mple" 
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
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