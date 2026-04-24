"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Define default marker icon paths manually so it doesn't break in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

function ChangeView({ center }: { center: L.LatLngExpression }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

function ClickHandler({ 
  position, 
  setPosition, 
  onAddressPicked, 
  internalUpdateRef 
}: { 
  position: L.LatLngExpression;
  setPosition: (pos: L.LatLngExpression) => void;
  onAddressPicked: (address: string) => void;
  internalUpdateRef: React.MutableRefObject<boolean>;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      internalUpdateRef.current = true; // Tandai bahwa user klik peta, jangan panggil forward-geocode
      // Call OpenStreetMap Nominatim API for reverse geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            onAddressPicked(data.display_name);
          }       })
        .catch((err) => console.error("Geocoding fetch failed:", err));
    },
  });
  return <Marker position={position} icon={customIcon} />;
}

// Hook to invalidate size when map container dimensions change
function MapResizer({ isExpanded }: { isExpanded: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [map, isExpanded]);
  return null;
}

export default function MapPicker({ onAddressPicked, addressValue }: { onAddressPicked: (address: string) => void, addressValue?: string }) {
  // Default position roughly central Jakarta / Monas
  const [position, setPosition] = useState<L.LatLngExpression>([-6.1751, 106.8271]);
  const [isExpanded, setIsExpanded] = useState(false);
  const internalUpdateRef = useRef(false);

  useEffect(() => {
    // Apabila alamat dari prop berubah, dan bukan berasal dari klik di peta
    if (addressValue && addressValue.length > 5) {
      if (internalUpdateRef.current) {
        // Skip karena ini perubahan dari leaflet map kita sendiri
        internalUpdateRef.current = false;
        return;
      }
      
      const bounceTimeout = setTimeout(() => {
        // Forward Geocoding: text ke coordinate
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressValue)}&limit=1`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
          })
          .catch((err) => console.error("Forward geocoding fetch failed:", err));
      }, 1000); // 1 detik debounce

      return () => clearTimeout(bounceTimeout);
    }
  }, [addressValue]);

  return (
    <>
      <div 
        className={isExpanded ? "fixed inset-0 z-[999999] bg-white overflow-hidden flex flex-col p-4" : "relative h-48 w-full rounded-xl z-10 block bg-slate-100 overflow-hidden border border-slate-200 shadow-sm transition-all duration-300"}
      >
        <div className={isExpanded ? "relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-200" : "w-full h-full relative"}>
          <MapContainer
            center={position}
            zoom={14}
            scrollWheelZoom={isExpanded}
            style={{ height: "100%", width: "100%", zIndex: 10 }}
          >
            <MapResizer isExpanded={isExpanded} />
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
            />
            <ClickHandler 
              position={position}
              setPosition={setPosition}
              onAddressPicked={onAddressPicked}
              internalUpdateRef={internalUpdateRef}
            />
            <ChangeView center={position} />
          </MapContainer>
        
        {/* Helper info tag */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-md bg-white/95 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-md backdrop-blur-sm border border-indigo-100">
          Klik peta untuk tetapkan lokasi
        </div>

        {/* Expand / Collapse Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="absolute top-4 right-4 z-[500] flex items-center justify-center p-2 rounded-lg bg-white/95 text-slate-700 hover:text-indigo-600 shadow-md backdrop-blur-sm border border-slate-200 transition-colors pointer-events-auto"
          title={isExpanded ? "Kecilkan Peta" : "Perbesar Peta"}
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>
    </div>
    </>
  );
}
