import React, { useState } from "react";
import MapView from "./MapView";
import axios from "axios";

export default function App() {
  const [start, setStart] = useState("19.075983,72.877655"); 
  const [end, setEnd] = useState("19.2183,72.9781");
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchRoute() {
    setLoading(true);
    try {
      const res = await axios.get("/api/route", {
        params: { start, end }
      });
      setRouteData(res.data);
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <div className="w-96 bg-white shadow-xl p-6 flex flex-col">
        
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Smart Traffic Dashboard
        </h1>

        <label className="text-sm font-semibold text-gray-600">Start (lat,lng)</label>
        <input
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border p-2 rounded mb-3"
        />

        <label className="text-sm font-semibold text-gray-600">End (lat,lng)</label>
        <input
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border p-2 rounded mb-4"
        />

        <button
          onClick={fetchRoute}
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Calculating..." : "Get Safe Route"}
        </button>

        {routeData && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
            <p><strong>Distance:</strong> {(routeData.route.distance / 1000).toFixed(2)} km</p>
            <p><strong>Duration:</strong> {(routeData.route.duration / 60).toFixed(1)} mins</p>
            <p><strong>Flood Risk:</strong> {(routeData.floodRisk * 100).toFixed(0)}%</p>
            <p><strong>Congestion:</strong> {(routeData.congestionScore * 100).toFixed(0)}%</p>
            <p className="font-bold text-blue-700">
              Safety Score: {(routeData.safetyScore * 100).toFixed(0)}%
            </p>
          </div>
        )}

      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapView routeData={routeData} />
      </div>
    </div>
  );
}
