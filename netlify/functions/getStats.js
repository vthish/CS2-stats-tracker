const axios = require('axios');

exports.handler = async (event, context) => {
  const { steamid, vanityurl } = event.queryStringParameters;
  const API_KEY = process.env.VITE_STEAM_API_KEY;

  console.log("Fetching stats for:", steamid || vanityurl);

  try {
    let finalSteamId = steamid;

    if (vanityurl) {
      const resolveUrl = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${API_KEY}&vanityurl=${vanityurl}`;
      const resolveRes = await axios.get(resolveUrl);
      if (resolveRes.data.response.success === 1) {
        finalSteamId = resolveRes.data.response.steamid;
      } else {
        return { statusCode: 404, body: JSON.stringify({ error: "Profile not found" }) };
      }
    }

    // Getting playtime - Adding free games support
    const ownedGamesUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${finalSteamId}&format=json&include_played_free_games=1`;
    const ownedGamesRes = await axios.get(ownedGamesUrl);
    
    const games = ownedGamesRes.data.response.games || [];
    const cs2Game = games.find(g => g.appid === 730);
    const playtimeMinutes = cs2Game ? cs2Game.playtime_forever : 0;

    // Getting combat stats
    const statsUrl = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${API_KEY}&steamid=${finalSteamId}`;
    const statsRes = await axios.get(statsUrl);

    console.log("Playtime found (mins):", playtimeMinutes);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        playtime_forever: playtimeMinutes,
        playerstats: statsRes.data.playerstats
      })
    };
  } catch (error) {
    console.error("Function Error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};