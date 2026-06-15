import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (latlng: LatLng, label: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        const label = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        onLocationSelect(e.latlng, label);
      } catch {
        onLocationSelect(e.latlng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    },
  });
  return null;
}

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 1 });
    }
  }, [position, map]);
  return null;
}

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [marker, setMarker] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleLocationSelect = useCallback((latlng: LatLng, label: string) => {
    setMarker([latlng.lat, latlng.lng]);
    onChange(label);
  }, [onChange]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const results: NominatimResult[] = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const pos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setMarker(pos);
        setFlyTo(pos);
        onChange(display_name);
      }
    } catch {
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setMarker(null);
    onChange("");
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe o busca una ubicación en el mapa"
            className="pl-9 pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMap((v) => !v)}
          className="shrink-0"
        >
          <MapPin className="h-4 w-4 mr-1" />
          {showMap ? "Ocultar mapa" : "Abrir mapa"}
        </Button>
      </div>

      {showMap && (
        <div className="rounded-lg overflow-hidden border shadow-sm space-y-2">
          <div className="flex gap-2 p-2 bg-muted/30 border-b">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar dirección o lugar..."
              className="h-8 text-sm"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSearch}
              disabled={isSearching}
              className="h-8 shrink-0"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              Buscar
            </Button>
          </div>

          <div className="h-64 w-full">
            <MapContainer
              center={marker ?? [-34.6037, -58.3816]}
              zoom={marker ? 14 : 5}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              <FlyToLocation position={flyTo} />
              {marker && <Marker position={marker} icon={markerIcon} />}
            </MapContainer>
          </div>

          <p className="text-xs text-muted-foreground px-3 pb-2">
            Haz clic en el mapa para fijar tu ubicación, o busca una dirección arriba.
          </p>
        </div>
      )}
    </div>
  );
}
