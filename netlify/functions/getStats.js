const axios = require('axios');

exports.handler = async (event, context) => {
  const { steamid, vanityurl } = event.queryStringParameters;
  const API_KEY = process.env.VITE_STEAM_API_KEY;

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

    // 1. Fetch Total Playtime (from Profile)
    const ownedGamesUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${finalSteamId}&format=json&appids_filter[0]=730`;
    const ownedGamesRes = await axios.get(ownedGamesUrl);
    const playtimeMinutes = ownedGamesRes.data.response.games?.[0]?.playtime_forever || 0;

    // 2. Fetch Combat Stats
    const statsUrl = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${API_KEY}&steamid=${finalSteamId}`;
    const statsRes = await axios.get(statsUrl);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        playtime_forever: playtimeMinutes, // This is in minutes
        playerstats: statsRes.data.playerstats
      })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch data" }) };
  }
};