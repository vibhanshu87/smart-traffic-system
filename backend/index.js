// backend/index.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

// simple health check
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// /api/route - uses OSRM + Open-Meteo to return route + flood risk + safety score
app.get("/api/route", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: "Missing start or end" });

    // parse lat,lng (user inputs "lat,lng")
    const [sLat, sLng] = start.split(",").map((v) => parseFloat(v.trim()));
    const [eLat, eLng] = end.split(",").map((v) => parseFloat(v.trim()));
    if ([sLat, sLng, eLat, eLng].some((v) => Number.isNaN(v))) {
      return res.status(400).json({ error: "Invalid coordinate format. Use lat,lng" });
    }

    // 1) OSRM route (format: lng,lat)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=polyline`;
    const osrmResp = await axios.get(osrmUrl, { timeout: 10000 });
    if (!osrmResp.data || !osrmResp.data.routes || !osrmResp.data.routes.length) {
      return res.status(502).json({ error: "OSRM did not return a route" });
    }
    const route = osrmResp.data.routes[0];

    // 2) Open-Meteo precipitation at midpoint (no API key)
    const midLat = (sLat + eLat) / 2;
    const midLng = (sLng + eLng) / 2;
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${midLat}&longitude=${midLng}&hourly=precipitation&forecast_days=1&timezone=UTC`;
    const meteoResp = await axios.get(meteoUrl, { timeout: 10000 });
    const precipArray = (meteoResp.data && meteoResp.data.hourly && meteoResp.data.hourly.precipitation) || [];
    const maxPrecip = precipArray.length ? Math.max(...precipArray) : 0;
    const floodRisk = Math.min(1, maxPrecip / 20); // normalized 0..1

    // 3) Congestion: simple static value for now (you can extend later to read Firestore)
    const congestionScore = 0.3;

    // 4) Safety score: combine flood and congestion (weights adjustable)
    const safetyScore = Math.min(1, floodRisk * 0.6 + congestionScore * 0.4);

    // Return the important pieces (route.geometry is polyline)
    return res.json({
      route: {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry
      },
      floodRisk,
      congestionScore,
      safetyScore
    });
  } catch (err) {
    console.error("Route error:", err && err.toString ? err.toString() : err);
    return res.status(500).json({ error: "Internal server error", details: err && err.message ? err.message : String(err) });
  }
});

// start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
