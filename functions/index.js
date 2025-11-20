const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// OSRM — Free routing engine API
async function getOsrm(startLat, startLng, endLat, endLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline`;
  const res = await axios.get(url);
  return res.data;
}

// Open-Meteo — Free weather API
async function getRain(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation&forecast_days=1`;
  const res = await axios.get(url);
  return res.data.hourly.precipitation;
}

function floodRisk(precipArray) {
  const max = Math.max(...precipArray);
  return Math.min(max / 20, 1); // 0–1 normalized
}

// MAIN API
app.get("/route", async (req, res) => {
  try {
    const { start, end } = req.query;

    const [sLat, sLng] = start.split(",").map(Number);
    const [eLat, eLng] = end.split(",").map(Number);

    const osrm = await getOsrm(sLat, sLng, eLat, eLng);
    const rainArr = await getRain((sLat + eLat) / 2, (sLng + eLng) / 2);

    const risk = floodRisk(rainArr);

    const route = osrm.routes[0];

    res.json({
      route,
      floodRisk: risk,
      congestionScore: 0.3, 
      safetyScore: (risk * 0.6) + (0.3 * 0.4),
    });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// EXPORT to Firebase
exports.api = functions.https.onRequest(app);
