import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import polyline from "@mapbox/polyline";

// Fix Leaflet default icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

export default function MapView({ routeData }) {
  const center = [19.075983, 72.877655];

  let coords = [];
  if (routeData?.route?.geometry) {
    coords = polyline.decode(routeData.route.geometry).map(([lat, lng]) => [lat, lng]);
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full"
      scrollWheelZoom={true}
    >
      {/* OpenStreetMap tiles — FREE FOREVER */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {coords.length > 0 && (
        <>
          <Polyline positions={coords} color="blue" weight={5} />
          <Marker position={coords[0]}>
            <Popup>Start</Popup>
          </Marker>
          <Marker position={coords[coords.length - 1]}>
            <Popup>End</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
