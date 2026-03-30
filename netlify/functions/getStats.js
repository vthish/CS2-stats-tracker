const axios = require('axios');

exports.handler = async (event, context) => {
  const { steamid, vanityurl } = event.queryStringParameters;
  const API_KEY = process.env.VITE_STEAM_API_KEY;

  try {
    let finalSteamId = steamid;

    // Resolve vanity URL if a profile name is provided
    if (vanityurl) {
      const resolveUrl = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${API_KEY}&vanityurl=${vanityurl}`;
      const resolveRes = await axios.get(resolveUrl);
      
      if (resolveRes.data.response.success === 1) {
        finalSteamId = resolveRes.data.response.steamid;
      } else {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Profile not found" }),
        };
      }
    }

    // Fetch CS2 stats using the resolved SteamID64
    const statsUrl = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${API_KEY}&steamid=${finalSteamId}`;
    const response = await axios.get(statsUrl);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch stats from Steam" }),
    };
  }
};